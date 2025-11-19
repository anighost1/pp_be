const { execSync } = require("child_process");

const schemas = [
    "prisma/schema.prisma",
    "prisma/saf/schema.prisma",
    "prisma/property/schema.prisma",
    "prisma/waste/schema.prisma"
]

schemas.forEach((schema) => {
    try {
        console.log(`\n▶ migrating schema for: ${schema}`);
        execSync(`npx prisma migrate deploy --schema=${schema}`, { stdio: "inherit" });
    } catch (err) {
        console.error(`❌ Failed to migrate for ${schema}:`, err.message);
    }
});

console.log("\n✅ All schemas migrated.");
