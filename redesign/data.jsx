// Local image data — references files under ../images/<country>/...
// Paths are relative to /redesign/index.html.
// Titles, country tags and full-size paths come straight from
// the live portfolio.html so the redesign mirrors real content.

// Encode each path segment so spaces/parens in filenames work everywhere.
const IMG = (path) => "../images/" + path.split("/").map(encodeURIComponent).join("/");

// Capitalize country slug from data-category ("japan" -> "Japan")
const CAP = (s) => s[0].toUpperCase() + s.slice(1);

// City inferred from title when it includes ", <City>"; otherwise leave blank.
const CITY = (title) => {
  const m = title.match(/,\s*([A-Z][^,]+)$/);
  return m ? m[1] : "";
};

// One row per gallery item from the live site's portfolio.html.
const ITEMS = [
  // Featured / titled
  ["japan",     "Torii Gate, Hakone",        "Japan/IMG_0393.JPG"],
  ["japan",     "Skytree & Sakura",          "Japan/IMG_0496.JPG"],
  ["japan",     "Canal Boat, Kyoto",         "Japan/IMG_0544.JPG"],
  ["japan",     "Osaka Castle",              "Japan/IMG_0590.JPG"],
  ["japan",     "Great Buddha, Kamakura",    "Japan/IMG_0893.JPG"],
  ["japan",     "Cherry Blossom Crossing",   "Japan/IMG_1282.JPG"],
  ["japan",     "Wedded Rocks, Ise",         "Japan/IMG_2564.JPG"],
  ["japan",     "Sakura Canal",              "Japan/IMG_8970.JPG"],
  ["japan",     "Daruma Dolls",              "Japan/_MG_5886.JPG"],
  ["china",     "Golden Campfire",           "China/DSCF6798.JPG"],
  ["china",     "Night Market Dumplings",    "China/DSCF7118.JPG"],
  ["china",     "Hexagon Window",            "China/DSCF8199.JPG"],
  ["china",     "Redhead Duck",              "China/DSCF8409.JPG"],
  ["china",     "Garden Pavilion",           "China/DSCF8511.JPG"],
  ["china",     "Old City, Shanghai",        "China/IMG_3029.JPG"],
  ["china",     "Canal, Suzhou",             "China/IMG_3181.JPG"],
  ["china",     "Shanghai Night",            "China/IMG_7694.JPG"],
  ["china",     "Temple Incense",            "China/IMG_9089.JPG"],
  ["japan",     "Dotonbori, Osaka",          "Japan/IMG_5583.JPG"],
  ["japan",     "Rickshaw, Kyoto",           "Japan/IMG_5305 2.JPG"],
  ["japan",     "Kanoko Train",              "Japan/IMG_5768 3.JPG"],
  ["japan",     "Tsutenkaku, Osaka",         "Japan/IMG_5931.JPG"],
  ["japan",     "Neon Alley",                "Japan/IMG_5936.JPG"],
  ["japan",     "Sakura After Dark",         "Japan/IMG_6090.JPG"],
  ["japan",     "Night Traffic",             "Japan/IMG_6143.JPG"],
  ["japan",     "Shibuya Crossing",          "Japan/IMG_6229 2.JPG"],
  ["japan",     "Late Night Corner",         "Japan/IMG_6785.JPG"],
  ["japan",     "Street Karts, Tokyo",       "Japan/IMG_6819 2.JPG"],
  ["china",     "Night Market Vendor",       "China/DSCF7231.JPG"],
  ["china",     "West Lake, Hangzhou",       "China/IMG_3244.JPG"],
  ["malaysia",  "Steel Arch Bridge",         "Malaysia/DSCF1058.JPG"],
  ["malaysia",  "KL Skyline",                "Malaysia/DSCF1062.JPG"],
  ["singapore", "Tropical Garden",           "Singapore/IMG_6462.JPG"],

  // Untitled archive — country only
  ["japan", "Japan", "Japan/DSC_0516.JPG"],
  ["japan", "Japan", "Japan/IMG_0546.JPG"],
  ["japan", "Japan", "Japan/IMG_0597.JPG"],
  ["japan", "Japan", "Japan/IMG_0911.JPG"],
  ["japan", "Japan", "Japan/IMG_1324.JPG"],
  ["japan", "Japan", "Japan/IMG_1338.JPG"],
  ["japan", "Japan", "Japan/IMG_1913.JPG"],
  ["japan", "Japan", "Japan/IMG_2010.JPG"],
  ["japan", "Japan", "Japan/IMG_2218 2.JPG"],
  ["japan", "Japan", "Japan/IMG_2253.JPG"],
  ["japan", "Japan", "Japan/IMG_2269.JPG"],
  ["japan", "Japan", "Japan/IMG_2341.JPG"],
  ["japan", "Japan", "Japan/IMG_2557.JPG"],
  ["japan", "Japan", "Japan/IMG_2558.JPG"],
  ["japan", "Japan", "Japan/IMG_2571.JPG"],
  ["japan", "Japan", "Japan/IMG_5317.JPG"],
  ["japan", "Japan", "Japan/IMG_5336 2.JPG"],
  ["japan", "Japan", "Japan/IMG_5365.JPG"],
  ["japan", "Japan", "Japan/IMG_5385 2.JPG"],
  ["japan", "Japan", "Japan/IMG_5708 2.JPG"],
  ["japan", "Japan", "Japan/IMG_5804 3.JPG"],
  ["japan", "Japan", "Japan/IMG_5876 2.JPG"],
  ["japan", "Japan", "Japan/IMG_5953.JPG"],
  ["japan", "Japan", "Japan/IMG_5959.JPG"],
  ["japan", "Japan", "Japan/IMG_6130 2.JPG"],
  ["japan", "Japan", "Japan/IMG_6248 2.JPG"],
  ["japan", "Japan", "Japan/IMG_6838 2.JPG"],
  ["japan", "Japan", "Japan/IMG_6845 2.JPG"],
  ["japan", "Japan", "Japan/IMG_6862 2.JPG"],
  ["japan", "Japan", "Japan/IMG_6969 2.JPG"],
  ["japan", "Japan", "Japan/_MG_4298 3.JPG"],

  ["china", "China", "China/DSCF7305.JPG"],
  ["china", "China", "China/DSCF8280.JPG"],
  ["china", "China", "China/DSCF8518.JPG"],
  ["china", "China", "China/DSCF8952.JPG"],
  ["china", "China", "China/IMG_2960.JPG"],
  ["china", "China", "China/IMG_3228.JPG"],
  ["china", "China", "China/IMG_3246.JPG"],
  ["china", "China", "China/IMG_3297.JPG"],
  ["china", "China", "China/IMG_3331.JPG"],
  ["china", "China", "China/IMG_3335.JPG"],
  ["china", "China", "China/IMG_3336.JPG"],
  ["china", "China", "China/IMG_3338.JPG"],
  ["china", "China", "China/IMG_3342.JPG"],
  ["china", "China", "China/IMG_6010.JPG"],
  ["china", "China", "China/IMG_6956.JPG"],
  ["china", "China", "China/IMG_7111.JPG"],
  ["china", "China", "China/IMG_7145.JPG"],
  ["china", "China", "China/IMG_7212.JPG"],
  ["china", "China", "China/IMG_7705.JPG"],
  ["china", "China", "China/IMG_8614.JPG"],
  ["china", "China", "China/IMG_8660.JPG"],
  ["china", "China", "China/IMG_8661.JPG"],
  ["china", "China", "China/IMG_8662.JPG"],
  ["china", "China", "China/IMG_9090.JPG"],
  ["china", "China", "China/IMG_9091.JPG"],

  ["malaysia", "Malaysia", "Malaysia/DSCF1078.JPG"],
  ["malaysia", "Malaysia", "Malaysia/IMG_6274.JPG"],

  ["taiwan", "Taiwan", "Taiwan/DSCF3878.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/DSCF3903.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/DSCF4191.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/DSCF4224.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/IMG_3876.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/IMG_3883.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/IMG_3924.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/IMG_3935.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/IMG_4057.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/IMG_4112.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/IMG_4169.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/IMG_4211.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/IMG_4289.jpeg"],
  ["taiwan", "Taiwan", "Taiwan/IMG_4412.jpeg"],

  ["brunei", "Brunei", "Brunei/IMG_5026.jpeg"],
  ["brunei", "Brunei", "Brunei/IMG_7949.jpeg"],
  ["brunei", "Brunei", "Brunei/IMG_7966.jpeg"],
  ["brunei", "Brunei", "Brunei/IMG_7968.jpeg"],
  ["brunei", "Brunei", "Brunei/IMG_7969.jpeg"],
  ["brunei", "Brunei", "Brunei/IMG_8029.jpeg"],
];

window.PORTFOLIO = ITEMS.map(([cat, title, path], i) => ({
  id: cat.slice(0, 2) + "-" + String(i + 1).padStart(3, "0"),
  country: CAP(cat),
  city: CITY(title) || CAP(cat),
  title,
  src: IMG(path),
}));

// Helpful lookup by image filename — used by Home to pin specific cards.
window.PORTFOLIO_BY_FILE = Object.fromEntries(
  ITEMS.map(([, , path], i) => [path, window.PORTFOLIO[i]])
);

// Hero image: same shot the live site uses on home
window.HERO_IMG = IMG("Japan/IMG_2564.JPG");

// Portrait for the About page (and home teaser).
// Switched to _MG_5717.jpeg for the about page; IMG_7403.jpg used on home.
window.PORTRAIT_IMG = IMG("alston shi/_MG_5717.jpeg");
window.PORTRAIT_IMG_HOME = IMG("alston shi/IMG_7403.jpg");
window.PORTRAIT_IMG_SECONDARY = IMG("alston shi/IMG_1014.jpg");

// Filter labels (match the live portfolio's category set)
window.COUNTRIES = ["All", "Japan", "China", "Taiwan", "Malaysia", "Singapore", "Brunei"];

// Gear (from the live About page)
window.GEAR = [
  "Fujifilm X-T Series",
  "Fuji X100V",
  "Canon EOS R",
  "DJI Pocket 3",
  "iPhone 17 PM",
  "Fujinon 23mm f/2",
  "Fujinon 35mm f/1.4",
  "Canon RF 50mm f/1.8",
  "Lightroom",
];
