
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            trainingProgram: true
        }
    });

    console.log("Found users:", users.length);
    users.forEach(u => {
        console.log(`User: ${u.name} (${u.id})`);
        console.log("Training Program Length:", u.trainingProgram ? u.trainingProgram.length : 0);
        if (u.trainingProgram) {
            console.log("--- Content Start ---");
            console.log(u.trainingProgram.substring(0, 500)); // Print first 500 chars
            console.log("--- Content End ---");
        } else {
            console.log("No training program found.");
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
