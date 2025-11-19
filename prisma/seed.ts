
import { PrismaClient as panelClient } from "../generated/panel";

const panel = new panelClient();

async function main() {

  await panel.zone_circle_master.createMany({
    data: [
      { name: "Testing Zone", zonecode: "1" },
    ],
  });

}

main()
  .then(async () => {
    await panel.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await panel.$disconnect();
    process.exit(1);
  });
