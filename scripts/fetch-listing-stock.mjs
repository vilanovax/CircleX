/**
 * Download listing stock JPEGs from Wikimedia Commons onto /public/listings.
 * Runtime serving is local — Commons is only the fetch source.
 */
import { execFileSync } from "node:child_process";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "listings");
const UA = "CircleX/1.0 (marketplace demo stock; local hosting)";

/** unsplash photo-* stem → { file, query } */
export const STOCK = {
  "photo-1460925895917-afdab827c52f": {
    file: "laptop-desk",
    titles: ["File:MacBook Air (2015).jpg", "File:Laptop computer.jpg"],
    query: "laptop on desk jpeg",
  },
  "photo-1548036328-c9fa89d128fa": {
    file: "leather-bag",
    titles: ["File:Leather briefcase.jpg", "File:Briefcase.jpg"],
    query: "leather briefcase bag jpeg",
  },
  "photo-1504148455328-c376907d081c": {
    file: "cordless-drill",
    titles: ["File:Cordless drill.jpg", "File:DeWalt drill.jpg"],
    query: "cordless drill tool jpeg",
  },
  "photo-1485955900006-10f4d324d411": {
    file: "terracotta-pot",
    titles: ["File:Terracotta flower pot.jpg", "File:Flowerpot.jpg"],
    query: "terracotta flower pot plant jpeg",
  },
  "photo-1485965120182-cf1713bcabf1": {
    file: "city-bicycle",
    titles: ["File:Bicycle in Amsterdam.jpg", "File:City bicycle.jpg"],
    query: "city bicycle urban jpeg",
  },
  "photo-1505740420928-5e560c06d30e": {
    file: "headphones",
    titles: [
      "File:Sennheiser HD 600 headphones.jpg",
      "File:Headphones.jpg",
    ],
    query: "over ear headphones jpeg",
  },
  "photo-1512820790803-83ca734da794": {
    file: "stacked-books",
    titles: ["File:Books HD (8314926999).jpg", "File:Stack of books.jpg"],
    query: "stack of books jpeg",
  },
  "photo-1588872657578-7efd1f1555ed": {
    file: "open-laptop",
    titles: ["File:Open laptop.jpg", "File:Laptop opened.jpg"],
    query: "open laptop computer jpeg",
  },
  "photo-1515488042361-ee00e0ddd4e4": {
    file: "baby-stroller",
    titles: ["File:Baby stroller.jpg", "File:Infant stroller.jpg"],
    query: "baby stroller pram jpeg",
  },
  "photo-1618220179428-22790b461013": {
    file: "wooden-desk",
    titles: ["File:Wooden writing desk.jpg", "File:Writing desk.jpg"],
    query: "wooden writing desk jpeg",
  },
  "photo-1519238263530-99bdd11df2ea": {
    file: "child-clothes",
    titles: ["File:Children's clothing.jpg", "File:Baby clothes.jpg"],
    query: "children clothing folded jpeg",
  },
  "photo-1555041469-a586c61ea9bc": {
    file: "fabric-sofa",
    titles: ["File:Grey sofa.jpg", "File:Sofa in living room.jpg"],
    query: "fabric sofa living room jpeg",
  },
  "photo-1553413077-190dd305871c": {
    file: "cardboard-boxes",
    titles: ["File:Cardboard boxes.jpg", "File:Moving boxes.jpg"],
    query: "cardboard moving boxes jpeg",
  },
  "photo-1524995997946-a1c2e315a42f": {
    file: "children-books",
    titles: ["File:Children's books.jpg", "File:Picture books.jpg"],
    query: "children picture books jpeg",
  },
  "photo-1511707171634-5f897ff02aa9": {
    file: "smartphone",
    titles: ["File:IPhone 13.jpg", "File:Smartphone.jpg"],
    query: "smartphone front jpeg",
  },
  "photo-1592899677977-9c10ca588bbd": {
    file: "smartphone-back",
    titles: ["File:IPhone back.jpg", "File:Smartphone rear.jpg"],
    query: "smartphone back camera jpeg",
  },
  "photo-1544244015-0df4b3ffc6b0": {
    file: "tablet",
    titles: ["File:IPad Air.jpg", "File:Tablet computer.jpg"],
    query: "tablet computer ipad jpeg",
  },
  "photo-1493663284031-b7e3aefcae8e": {
    file: "living-room-sofa",
    titles: ["File:Living room sofa.jpg", "File:Couch.jpg"],
    query: "living room couch sofa jpeg",
  },
  "photo-1567016432779-094069958ea5": {
    file: "two-seat-sofa",
    titles: ["File:Loveseat.jpg", "File:Two seat sofa.jpg"],
    query: "two seat sofa loveseat jpeg",
  },
  "photo-1517336714731-489689fd1ca8": {
    file: "macbook",
    titles: ["File:MacBook Pro.jpg", "File:Apple MacBook.jpg"],
    query: "macbook laptop silver jpeg",
  },
  "photo-1530018607912-eff2daa1bac4": {
    file: "dining-table",
    titles: ["File:Dining table.jpg", "File:Wooden dining table.jpg"],
    query: "wooden dining table jpeg",
  },
  "photo-1503602642458-232111445657": {
    file: "wooden-chair",
    titles: ["File:Wooden chair.jpg", "File:Dining chair.jpg"],
    query: "wooden dining chair jpeg",
  },
  "photo-1571175443880-49e1d25b2bc5": {
    file: "refrigerator",
    titles: ["File:Refrigerator.jpg", "File:Kitchen refrigerator.jpg"],
    query: "kitchen refrigerator jpeg",
  },
  "photo-1593359677879-a4bb92f829d1": {
    file: "flat-tv",
    titles: ["File:Flat screen television.jpg", "File:LCD TV.jpg"],
    query: "flat screen television jpeg",
  },
  "photo-1594620302200-9a762244a156": {
    file: "bookshelf",
    titles: ["File:Bookshelf.jpg", "File:Bookshelves.jpg"],
    query: "wooden bookshelf books jpeg",
  },
  "photo-1520523839897-bd0b52f945a0": {
    file: "piano",
    titles: ["File:Grand piano.jpg", "File:Upright piano.jpg"],
    query: "piano instrument jpeg",
  },
  "photo-1513883049090-d0b7439799bf": {
    file: "piano-keys",
    titles: ["File:Piano keys.jpg", "File:Piano keyboard.jpg"],
    query: "piano keyboard keys close jpeg",
  },
  "photo-1507838153410-b1bf453d1f84": {
    file: "piano-side",
    titles: ["File:Piano side view.jpg", "File:Black piano.jpg"],
    query: "upright piano side jpeg",
  },
  "photo-1566576912321-d58ddd7a6088": {
    file: "wooden-toys",
    titles: ["File:Wooden toys.jpg", "File:Toy blocks.jpg"],
    query: "wooden children toys jpeg",
  },
  "photo-1596461404969-9ae70f2830fc": {
    file: "stuffed-toys",
    titles: ["File:Teddy bear.jpg", "File:Stuffed animals.jpg"],
    query: "teddy bear stuffed toy jpeg",
  },
  "photo-1632661674596-df8be070a5c6": {
    file: "iphone",
    titles: ["File:IPhone 13 blue.jpg", "File:IPhone 12.jpg"],
    query: "iphone smartphone jpeg",
  },
  "photo-1591337676887-a217a6970a8a": {
    file: "iphone-side",
    titles: ["File:IPhone side.jpg", "File:IPhone 11.jpg"],
    query: "iphone side profile jpeg",
  },
  "photo-1510557880182-3d4d3cba35a5": {
    file: "iphone-screen",
    titles: ["File:IPhone screen.jpg", "File:Smartphone display.jpg"],
    query: "smartphone display screen jpeg",
  },
  "photo-1552519507-da3b142c6e3d": {
    file: "compact-car",
    titles: ["File:Toyota Corolla.jpg", "File:White sedan.jpg"],
    query: "white compact sedan car jpeg",
  },
  "photo-1494976388531-d10584930316": {
    file: "white-car",
    titles: ["File:White car.jpg", "File:Sedan car.jpg"],
    query: "white car front jpeg",
  },
  "photo-1503376780353-7e6692767b70": {
    file: "car-front",
    titles: ["File:Car front view.jpg", "File:Automobile front.jpg"],
    query: "car front headlights jpeg",
  },
  "photo-1549317661-bd32c8ce0db2": {
    file: "car-side",
    titles: ["File:Car side view.jpg", "File:Sedan side.jpg"],
    query: "car side profile jpeg",
  },
  "photo-1581578731548-c64695cc6952": {
    file: "washing-machine",
    titles: ["File:Washing machine.jpg", "File:Front load washer.jpg"],
    query: "washing machine appliance jpeg",
  },
  "photo-1556911220-bff31c812dce": {
    file: "kitchen-counter",
    titles: ["File:Kitchen counter.jpg", "File:Modern kitchen.jpg"],
    query: "kitchen counter appliances jpeg",
  },
  "photo-1621905251189-08b45d6a269e": {
    file: "power-tools",
    titles: ["File:Power tools.jpg", "File:Toolbox.jpg"],
    query: "power tools toolbox jpeg",
  },
  "photo-1576678927484-cc907957088c": {
    file: "treadmill",
    titles: ["File:Treadmill.jpg", "File:Treadmill in gym.jpg"],
    query: "treadmill gym jpeg",
  },
  "photo-1517836357463-d25dfeac3438": {
    file: "gym-weights",
    titles: ["File:Dumbbells.jpg", "File:Gym weights.jpg"],
    query: "dumbbells gym weights jpeg",
  },
  "photo-1483721310020-03333e577078": {
    file: "yoga-mat",
    titles: ["File:Yoga mat.jpg", "File:Yoga.jpg"],
    query: "yoga mat exercise jpeg",
  },
  "photo-1478131143081-80f7f84ca84d": {
    file: "camping-tent",
    titles: ["File:Camping tent.jpg", "File:Dome tent.jpg"],
    query: "camping tent outdoors jpeg",
  },
  "photo-1504280390367-361c6d9f38f4": {
    file: "camping-gear",
    titles: ["File:Camping gear.jpg", "File:Backpack camping.jpg"],
    query: "camping backpack gear jpeg",
  },
  "photo-1523987355523-c7b5b0dd90a7": {
    file: "camper-van",
    titles: ["File:Camper van.jpg", "File:Volkswagen camper.jpg"],
    query: "camper van camping jpeg",
  },
  "photo-1554224155-6726b3ff858f": {
    file: "calculator",
    titles: ["File:Calculator.jpg", "File:Casio calculator.jpg"],
    query: "calculator office jpeg",
  },
  "photo-1579621970563-ebec7560ff3e": {
    file: "coins-savings",
    titles: ["File:Piggy bank.jpg", "File:Stack of coins.jpg"],
    query: "piggy bank coins savings jpeg",
  },
  "photo-1503454537195-1dcabb73ffb9": {
    file: "toddler",
    titles: ["File:Toddler playing.jpg", "File:Child playing.jpg"],
    query: "toddler child playing jpeg",
  },
  "photo-1476703993599-0035a21b17a9": {
    file: "parent-child",
    titles: ["File:Parent and child.jpg", "File:Mother and child.jpg"],
    query: "parent child family jpeg",
  },
  "photo-1516627145497-ae6968895b74": {
    file: "baby",
    titles: ["File:Baby.jpg", "File:Sleeping baby.jpg"],
    query: "baby infant jpeg",
  },
  "photo-1434493789847-2f02dc6ca35d": {
    file: "smartwatch",
    titles: ["File:Apple Watch.jpg", "File:Smartwatch.jpg"],
    query: "smartwatch wrist jpeg",
  },
  "photo-1579586337278-3befd40fd17a": {
    file: "wristwatch",
    titles: ["File:Wristwatch.jpg", "File:Analog watch.jpg"],
    query: "wristwatch analog jpeg",
  },
  "photo-1546868871-7041f2a55e12": {
    file: "analog-watch",
    titles: ["File:Pocket watch.jpg", "File:Watch face.jpg"],
    query: "watch close up jpeg",
  },
  "photo-1561070791-2526d30994b5": {
    file: "color-swatches",
    titles: ["File:Color swatches.jpg", "File:Pantone.jpg"],
    query: "color swatches design jpeg",
  },
  "photo-1626785774573-4b7993143466": {
    file: "graphic-design",
    titles: ["File:Graphic design.jpg", "File:Design sketch.jpg"],
    query: "graphic design workspace jpeg",
  },
  "photo-1634942537034-2531766767d1": {
    file: "sketch-markers",
    titles: ["File:Markers.jpg", "File:Colored pencils.jpg"],
    query: "design markers pencils jpeg",
  },
  "photo-1556228453-efd6c1ff04f6": {
    file: "armchair",
    titles: ["File:Armchair.jpg", "File:Upholstered chair.jpg"],
    query: "armchair living room jpeg",
  },
};

const usedUrls = new Set();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchRetry(url, init, tries = 8) {
  let last = 0;
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { ...init, redirect: "follow" });
    if (res.status !== 429 && res.status !== 503) return res;
    last = res.status;
    const wait = 5000 * (i + 1);
    process.stdout.write(`wait ${res.status}/${wait}ms `);
    await sleep(wait);
  }
  throw new Error(`${last} ${url}`);
}

async function wiki(url) {
  const res = await fetchRetry(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function imageInfo(title) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      titles: title,
      prop: "imageinfo",
      iiprop: "url|mime|size",
      iiurlwidth: "1200",
      format: "json",
      origin: "*",
    });
  const data = await wiki(url);
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing || !page.imageinfo?.[0]) return null;
  const ii = page.imageinfo[0];
  const src = ii.thumburl || ii.url;
  if (!src || usedUrls.has(src)) return null;
  return src;
}

async function searchFile(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: `${query} filetype:bitmap`,
      srnamespace: "6",
      srlimit: "12",
      format: "json",
      origin: "*",
    });
  const data = await wiki(url);
  for (const hit of data.query?.search ?? []) {
    const src = await imageInfo(hit.title);
    if (src) return src;
  }
  return null;
}

async function download(src, destJpg) {
  const res = await fetchRetry(src, {
    headers: { "User-Agent": UA, Referer: "https://commons.wikimedia.org/" },
  });
  if (!res.ok) throw new Error(`download ${res.status} ${src}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const tmp = destJpg + ".tmp";
  await writeFile(tmp, buf);
  execFileSync("sips", [
    "-s",
    "format",
    "jpeg",
    "-s",
    "formatOptions",
    "78",
    "--resampleHeightWidthMax",
    "1200",
    tmp,
    "--out",
    destJpg,
  ], { stdio: "pipe" });
  await unlink(tmp).catch(() => {});
}

async function openverse(query) {
  const url =
    "https://api.openverse.org/v1/images/?" +
    new URLSearchParams({
      q: query.replace(/\bjpeg\b/gi, "").trim(),
      license_type: "commercial",
      category: "photograph",
      page_size: "12",
    });
  const res = await fetchRetry(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  for (const hit of data.results ?? []) {
    const src = hit.url || "";
    if (!src || usedUrls.has(src)) continue;
    if (/unsplash|images\.unsplash/i.test(src)) continue;
    if (!/^https?:\/\//i.test(src)) continue;
    return src;
  }
  return null;
}

async function resolveSrc(entry) {
  const fromOpenverse = await openverse(entry.query);
  if (fromOpenverse) return fromOpenverse;
  for (const title of entry.titles) {
    const src = await imageInfo(title);
    if (src) return src;
  }
  return searchFile(entry.query);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const { stat } = await import("node:fs/promises");
  const failed = [];
  for (const [id, entry] of Object.entries(STOCK)) {
    const dest = path.join(OUT, `${entry.file}.jpg`);
    process.stdout.write(`${entry.file} … `);
    try {
      const existing = await stat(dest).catch(() => null);
      if (existing && existing.size > 8_000) {
        console.log("skip");
        continue;
      }
      await sleep(800);
      const src = await resolveSrc(entry);
      if (!src) throw new Error("no commons hit");
      usedUrls.add(src);
      await download(src, dest);
      console.log("ok");
    } catch (err) {
      failed.push(`${id} (${entry.file}): ${err.message}`);
      console.log("FAIL", err.message);
    }
  }
  if (failed.length) {
    console.error("\nFailed:\n" + failed.join("\n"));
    process.exit(1);
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) main();
