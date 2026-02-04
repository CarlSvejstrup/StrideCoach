export interface DayPlan {
    day: string;
    title: string;
    content: string;
    type: 'run' | 'rest' | 'cross-train' | 'other';
}

export interface WeeklyPlan {
    weekTitle: string;
    startDate?: string;
    days: DayPlan[];
}

export function parseTrainingPlan(markdown: string | null): WeeklyPlan[] {
    if (!markdown) return [];

    // Strategy 0: JSON parsing
    try {
        // basic check if it looks like JSON to avoid trying to parse large markdown texts as JSON
        if (markdown.trim().startsWith('{') || markdown.trim().startsWith('[')) {
            const json = JSON.parse(markdown);
            const jsonWeeks = parseJsonFormat(json);
            if (jsonWeeks.length > 0) return jsonWeeks;
        }
    } catch (e) {
        // Not valid JSON, continue to other strategies
    }

    const lines = markdown.split('\n');

    // Strategy 1: Table-based parsing
    const tableWeeks = parseTableFormat(lines);
    if (tableWeeks.length > 0) {
        return tableWeeks;
    }

    // Strategy 2: Header-based parsing (Fallback)
    return parseHeaderFormat(lines);
}

function parseJsonFormat(json: any): WeeklyPlan[] {
    if (!json.weekly_schedule || !Array.isArray(json.weekly_schedule)) {
        return [];
    }

    return json.weekly_schedule.map((week: any) => {
        const days: DayPlan[] = (week.sessions || []).map((session: any) => {
            let type: DayPlan['type'] = 'other';
            const sessionType = (session.type || '').toLowerCase();

            if (sessionType.includes('rest')) type = 'rest';
            else if (sessionType.includes('recovery') || sessionType.includes('easy') || sessionType.includes('run') ||
                sessionType.includes('fartlek') || sessionType.includes('interval') || sessionType.includes('steady') ||
                sessionType.includes('quality') || sessionType.includes('race') || sessionType.includes('shakeout') ||
                sessionType.includes('vert') || sessionType.includes('trail')) {
                type = 'run';
            } else if (sessionType.includes('cross') || sessionType.includes('strength') || sessionType.includes('alternative')) {
                type = 'cross-train';
            }

            let contentParts = [];
            if (session.duration_minutes) contentParts.push(`**Duration:** ${session.duration_minutes} min`);
            if (session.vert_meters) contentParts.push(`**Vert:** ${session.vert_meters}m`);
            if (session.notes) contentParts.push(session.notes);

            return {
                day: session.day,
                title: session.type || "Training",
                content: contentParts.join('\n\n'),
                type
            };
        });

        // Ensure days are sorted
        const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.sort((a, b) => allDays.indexOf(a.day) - allDays.indexOf(b.day));

        return {
            weekTitle: `Week ${week.week_number}`,
            startDate: week.start_date,
            days
        };
    });
}

function parseTableFormat(lines: string[]): WeeklyPlan[] {
    const weeks: WeeklyPlan[] = [];
    let headers: { [key: number]: string } = {};
    let foundHeader = false;

    // Helper to clean cell content: remove **bold**, trim whitespace
    const cleanCell = (s: string) => s.replace(/\*\*/g, '').trim();

    // Map Danish/English headers to standardized keys
    const normalizeHeader = (h: string) => {
        const lower = h.toLowerCase();
        if (lower.includes('uge') || lower.includes('week')) return 'week';
        if (lower.includes('mandag') || lower.includes('monday') || lower.includes('mon')) return 'Monday';
        if (lower.includes('tirsdag') || lower.includes('tuesday') || lower.includes('tue')) return 'Tuesday';
        if (lower.includes('onsdag') || lower.includes('wednesday') || lower.includes('wed')) return 'Wednesday';
        if (lower.includes('torsdag') || lower.includes('thursday') || lower.includes('thu')) return 'Thursday';
        if (lower.includes('fredag') || lower.includes('friday') || lower.includes('fri')) return 'Friday';
        if (lower.includes('lørdag') || lower.includes('saturday') || lower.includes('sat')) return 'Saturday';
        if (lower.includes('søndag') || lower.includes('sunday') || lower.includes('sun')) return 'Sunday';
        return null; // Ignore other columns like "Date" or "Total"
    };

    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith('|')) continue;

        // processing a table row
        // Split by |, filter out empty strings resulting from leading/trailing pipes
        const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);

        // Check if this is a header row
        // It's a header if it has Week or Monday in it
        const isHeader = cells.some(c => {
            const n = normalizeHeader(cleanCell(c));
            return n === 'week' || n === 'Monday';
        });

        if (isHeader && !line.includes('---')) {
            headers = {};
            cells.forEach((cell, idx) => {
                const norm = normalizeHeader(cleanCell(cell));
                if (norm) headers[idx] = norm;
            });
            foundHeader = true;
            continue;
        }

        if (line.includes('---')) continue; // Separator row

        if (foundHeader) {
            // This is a data row
            const weekData: DayPlan[] = [];
            let weekNum = "";

            cells.forEach((cell, idx) => {
                const columnType = headers[idx];
                if (!columnType) return;

                const content = cleanCell(cell);

                if (columnType === 'week') {
                    weekNum = content;
                } else {
                    // It's a day
                    // Determine type based on content
                    let type: DayPlan['type'] = 'other';
                    const lower = content.toLowerCase();
                    if (lower === '' || lower === '-' || lower === 'off' || lower === 'fri' || lower === 'rest') type = 'rest';
                    else if (lower.match(/\d+\s*(km|min)/) || lower.includes('løb') || lower.includes('run') || lower.includes('fart') || lower.includes('interval')) type = 'run';
                    else if (lower.includes('hm') || lower.includes('vert')) type = 'run'; // Vertical meters usually run/hike
                    else if (lower.includes('styrke') || lower.includes('gym') || lower.includes('swim') || lower.includes('bike')) type = 'cross-train';

                    if (content) {
                        weekData.push({
                            day: columnType,
                            title: content,
                            content: content, // In table format, title is often the whole content
                            type
                        });
                    }
                }
            });

            if (weekNum) {
                // Fill in missing days as rest
                allDays.forEach(d => {
                    if (!weekData.find(wd => wd.day === d)) {
                        weekData.push({
                            day: d,
                            title: "Rest",
                            content: "",
                            type: 'rest'
                        });
                    }
                });

                // Sort days correctly
                weekData.sort((a, b) => allDays.indexOf(a.day) - allDays.indexOf(b.day));

                weeks.push({
                    weekTitle: `Week ${weekNum}`,
                    days: weekData
                });
            }
        }
    }

    return weeks;
}

function parseHeaderFormat(lines: string[]): WeeklyPlan[] {
    const weeks: WeeklyPlan[] = [];
    let currentWeek: WeeklyPlan | null = null;
    let currentDay: DayPlan | null = null;

    // Helper to finalize the current day and add it to the week
    const pushCurrentDay = () => {
        if (currentWeek && currentDay) {
            currentWeek.days.push(currentDay);
            currentDay = null; // Reset for the next day
        }
    };

    // Helper to finalize the current week and add it to the list
    const pushCurrentWeek = () => {
        // First, ensure any pending day is added
        pushCurrentDay();

        if (currentWeek) {
            weeks.push(currentWeek);
            currentWeek = null;
        }
    };

    // Regex patterns
    // Week Header: # Week 1, ## Week 1, etc.
    const weekRegex = /^#{1,3}\s+(Week\s+\d+|Intro|Base Phase|Race Week|Uge\s+\d+)(.*)/i;
    // Day Header: ### Monday, or just "**Monday**", or "Monday" if it looks like a header
    const dayRegex = /^(?:#{3,4}|\*\*|\-)\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag)(?:[:\s]*)(.*)/i;

    const translateDay = (d: string) => {
        const map: { [key: string]: string } = {
            'mandag': 'Monday', 'tirsdag': 'Tuesday', 'onsdag': 'Wednesday', 'torsdag': 'Thursday',
            'fredag': 'Friday', 'lørdag': 'Saturday', 'søndag': 'Sunday'
        };
        return map[d.toLowerCase()] || d;
    };

    for (const line of lines) {
        const weekMatch = line.match(weekRegex);
        const dayMatch = line.match(dayRegex);

        if (weekMatch) {
            pushCurrentWeek();
            currentWeek = {
                weekTitle: weekMatch[1].trim() + (weekMatch[2] ? ' ' + weekMatch[2].trim() : ''),
                days: []
            };
            continue;
        }

        if (dayMatch) {
            pushCurrentDay();
            // Just created a week if we found a day but have no week container (fallback)
            if (!currentWeek) {
                currentWeek = { weekTitle: "Training Plan", days: [] };
            }

            const dayName = translateDay(dayMatch[1]);
            let restOfLine = dayMatch[2]?.trim().replace(/\*\*/g, '') || "";

            // Try to infer type from the title line
            let type: DayPlan['type'] = 'other';
            const lowerTitle = restOfLine.toLowerCase();
            if (lowerTitle.includes('rest') || lowerTitle.includes('off') || lowerTitle.includes('fri')) type = 'rest';
            else if (lowerTitle.includes('run') || lowerTitle.includes('jog') || lowerTitle.includes('intervals') || lowerTitle.includes('tempo') || lowerTitle.includes('løb')) type = 'run';
            else if (lowerTitle.includes('bike') || lowerTitle.includes('swim') || lowerTitle.includes('gym') || lowerTitle.includes('cross') || lowerTitle.includes('styrke')) type = 'cross-train';

            currentDay = {
                day: dayName,
                title: restOfLine || "Training",
                content: "",
                type
            };
            continue;
        }

        // If we are inside a day, append content
        if (currentDay) {
            currentDay.content += line + "\n";

            // If we didn't firmly detect type from title, check content
            if (currentDay.type === 'other' && currentDay.content.length < 200) {
                const lowerContent = currentDay.content.toLowerCase();
                if (lowerContent.includes('rest day')) currentDay.type = 'rest';
                else if (lowerContent.includes('kilometer') || lowerContent.includes('mile') || lowerContent.includes('km')) currentDay.type = 'run';
            }
        }
    }

    pushCurrentWeek(); // Final flush

    return weeks;
}
