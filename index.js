import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionFlagsBits
} from "discord.js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const ITEMS_LINK = process.env.ITEMSATIS_LINK;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});


// ================= JSON SİSTEM =================
function loadProducts() {
  if (!fs.existsSync("./urunler.json")) {
    fs.writeFileSync("./urunler.json", "[]");
  }
  return JSON.parse(fs.readFileSync("./urunler.json"));
}

function saveProducts(data) {
  fs.writeFileSync("./urunler.json", JSON.stringify(data, null, 2));
}


// ================= SLASH KOMUTLAR =================
const commands = [

  new SlashCommandBuilder()
    .setName("urun-ekle")
    .setDescription("Yeni ürün ekler")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName("isim").setDescription("Ürün adı").setRequired(true))
    .addIntegerOption(o =>
      o.setName("fiyat").setDescription("Fiyat").setRequired(true))
    .addIntegerOption(o =>
      o.setName("stok").setDescription("Stok").setRequired(true))
    .addIntegerOption(o =>
      o.setName("indirim").setDescription("İndirim %").setRequired(true)),

  new SlashCommandBuilder()
    .setName("urun-sil")
    .setDescription("Ürün siler")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName("isim").setDescription("Ürün adı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("market")
    .setDescription("Market ürünlerini göster"),

  new SlashCommandBuilder()
    .setName("satinal")
    .setDescription("Ürün satın al")
    .addStringOption(o =>
      o.setName("isim").setDescription("Ürün adı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("Premium duyuru gönderir")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName("mesaj")
        .setDescription("Duyuru mesajı")
        .setRequired(true))
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


// ================= READY =================
client.once("ready", () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});


// ================= KOMUT HANDLER =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const products = loadProducts();

  // ===== ÜRÜN EKLE =====
  if (interaction.commandName === "urun-ekle") {

    const isim = interaction.options.getString("isim");
    const fiyat = interaction.options.getInteger("fiyat");
    const stok = interaction.options.getInteger("stok");
    const indirim = interaction.options.getInteger("indirim");

    products.push({ isim, fiyat, stok, indirim });
    saveProducts(products);

    return interaction.reply(`✅ ${isim} eklendi.`);
  }

  // ===== ÜRÜN SİL =====
  if (interaction.commandName === "urun-sil") {

    const isim = interaction.options.getString("isim");
    const newProducts = products.filter(p => p.isim !== isim);
    saveProducts(newProducts);

    return interaction.reply(`🗑️ ${isim} silindi.`);
  }

  // ===== MARKET =====
  if (interaction.commandName === "market") {

    if (products.length === 0)
      return interaction.reply("Market boş.");

    const embed = new EmbedBuilder()
      .setTitle("🛒 ShopKeeper Market")
      .setColor("#ff9900");

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

    return interaction.reply({ embeds: [embed] });
  }

  // ===== SATIN AL =====
  if (interaction.commandName === "satinal") {

    const isim = interaction.options.getString("isim");
    const urun = products.find(p => p.isim === isim);

    if (!urun)
      return interaction.reply("❌ Ürün bulunamadı.");

    if (urun.stok <= 0)
      return interaction.reply("❌ Stok bitti.");

    urun.stok -= 1;
    saveProducts(products);

    return interaction.reply(`✅ ${isim} satın alındı. Kalan stok: ${urun.stok}`);
  }

  // ===== DUYURU =====
  if (interaction.commandName === "duyuru") {

    const mesaj = interaction.options.getString("mesaj");

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "🛒 ShopKeeper Premium Duyuru",
        iconURL: client.user.displayAvatarURL()
      })
      .setTitle("🚀 YENİ DUYURU")
      .setDescription(`✨ ${mesaj}`)
      .setColor("#ff9900")
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({
        text: `Duyuruyu yapan: ${interaction.user.tag}`
      })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setLabel("🛍️ Mağazaya Git")
      .setStyle(ButtonStyle.Link)
      .setURL(ITEMS_LINK);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({
      content: "@everyone",
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: "✅ Premium duyuru gönderildi.",
      ephemeral: true
    });
  }

});

client.login(TOKEN);
