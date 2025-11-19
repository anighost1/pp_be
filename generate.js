const { execSync } = require("child_process");

const schemas = [
    "prisma/schema.prisma",
    "prisma/user_charge/schema.prisma"
]

schemas.forEach((schema) => {
    try {
        console.log(`\n▶ Generating client for: ${schema}`);
        execSync(`npx prisma generate --schema=${schema}`, { stdio: "inherit" });
    } catch (err) {
        console.error(`❌ Failed to generate for ${schema}:`, err.message);
    }
});

console.log("\n✅ All clients generated.");
