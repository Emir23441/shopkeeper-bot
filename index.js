import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================== JSON LOAD ==================
function loadProducts() {
  if (!fs.existsSync("./urunler.json")) {
    fs.writeFileSync("./urunler.json", "[]");
  }
  return JSON.parse(fs.readFileSync("./urunler.json"));
}

function saveProducts(data) {
  fs.writeFileSync("./urunler.json", JSON.stringify(data, null, 2));
}

// ================== SLASH KOMUTLAR ==================
const commands = [
  new SlashCommandBuilder()
    .setName("urun-ekle")
    .setDescription("Yeni ürün ekler")
    .addStringOption(o =>
      o.setName("isim").setDescription("Ürün adı").setRequired(true))
    .addIntegerOption(o =>
      o.setName("fiyat").setDescription("Ürün fiyatı").setRequired(true))
    .addIntegerOption(o =>
      o.setName("stok").setDescription("Stok miktarı").setRequired(true))
    .addIntegerOption(o =>
      o.setName("indirim").setDescription("İndirim % (0 yazılabilir)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("urun-sil")
    .setDescription("Ürün siler")
    .addStringOption(o =>
      o.setName("isim").setDescription("Silinecek ürün").setRequired(true)),

  new SlashCommandBuilder()
    .setName("market")
    .setDescription("Market ürünlerini göster"),

  new SlashCommandBuilder()
    .setName("satinal")
    .setDescription("Ürün satın alır")
    .addStringOption(o =>
      o.setName("isim").setDescription("Ürün adı").setRequired(true))
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Slash komutlar yüklendi.");
  } catch (err) {
    console.error(err);
  }
})();

// ================== BOT READY ==================
client.once("ready", () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

// ================== KOMUT HANDLER ==================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const products = loadProducts();

  // SADECE ADMIN EKLEYEBİLSİN
  if (interaction.commandName === "urun-ekle") {
    if (!interaction.member.permissions.has("Administrator"))
      return interaction.reply({ content: "❌ Sadece admin kullanabilir.", ephemeral: true });

    const isim = interaction.options.getString("isim");
    const fiyat = interaction.options.getInteger("fiyat");
    const stok = interaction.options.getInteger("stok");
    const indirim = interaction.options.getInteger("indirim");

    products.push({ isim, fiyat, stok, indirim });
    saveProducts(products);

    interaction.reply(`✅ ${isim} eklendi.`);
  }

  if (interaction.commandName === "urun-sil") {
    if (!interaction.member.permissions.has("Administrator"))
      return interaction.reply({ content: "❌ Sadece admin kullanabilir.", ephemeral: true });

    const isim = interaction.options.getString("isim");
    const newProducts = products.filter(p => p.isim !== isim);
    saveProducts(newProducts);

    interaction.reply(`🗑️ ${isim} silindi.`);
  }

  if (interaction.commandName === "market") {
    if (products.length === 0)
      return interaction.reply("Market boş.");

    const embed = new EmbedBuilder()
      .setTitle("🛒 ShopKeeper Market")
      .setColor("Gold");

    products.forEach(p => {
      const indirimli = p.fiyat - (p.fiyat * p.indirim / 100);
      embed.addFields({
        name: p.isim,
        value:
          `💰 Fiyat: ${indirimli} TL\n` +
          `📦 Stok: ${p.stok}\n` +
          `🔥 İndirim: %${p.indirim}`
      });
    });

    interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "satinal") {
    const isim = interaction.options.getString("isim");
    const urun = products.find(p => p.isim === isim);

    if (!urun)
      return interaction.reply("❌ Ürün bulunamadı.");

    if (urun.stok <= 0)
      return interaction.reply("❌ Stok bitti.");

    urun.stok -= 1;
    saveProducts(products);

    interaction.reply(`✅ ${isim} satın alındı. Kalan stok: ${urun.stok}`);
  }
});

client.login(TOKEN);
