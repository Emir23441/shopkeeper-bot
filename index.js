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


// ================= DOSYA SİSTEMİ =================
const dosyaYolu = "./urunler.json";

function urunleriGetir() {
  if (!fs.existsSync(dosyaYolu)) {
    fs.writeFileSync(dosyaYolu, "[]");
  }
  return JSON.parse(fs.readFileSync(dosyaYolu));
}

function urunleriKaydet(data) {
  fs.writeFileSync(dosyaYolu, JSON.stringify(data, null, 2));
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
    console.error("Slash yükleme hatası:", err);
  }
})();


// ================= READY =================
client.once("ready", () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});


// ================= KOMUT HANDLER =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {

    await interaction.deferReply({ ephemeral: false });

    let products = urunleriGetir();

    // ===== ÜRÜN EKLE =====
    if (interaction.commandName === "urun-ekle") {

      const isim = interaction.options.getString("isim");
      const fiyat = interaction.options.getInteger("fiyat");
      const stok = interaction.options.getInteger("stok");
      const indirim = interaction.options.getInteger("indirim");

      products.push({ isim, fiyat, stok, indirim });
      urunleriKaydet(products);

      return interaction.editReply(`✅ ${isim} eklendi.`);
    }

    // ===== ÜRÜN SİL =====
    if (interaction.commandName === "urun-sil") {

      const isim = interaction.options.getString("isim");
      products = products.filter(p => p.isim !== isim);
      urunleriKaydet(products);

      return interaction.editReply(`🗑️ ${isim} silindi.`);
    }

    // ===== MARKET =====
    if (interaction.commandName === "market") {

      if (products.length === 0)
        return interaction.editReply("Market boş.");

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

      return interaction.editReply({ embeds: [embed] });
    }

    // ===== SATINAL =====
    if (interaction.commandName === "satinal") {

      const isim = interaction.options.getString("isim");
      const urun = products.find(p => p.isim === isim);

      if (!urun)
        return interaction.editReply("❌ Ürün bulunamadı.");

      if (urun.stok <= 0)
        return interaction.editReply("❌ Stok bitti.");

      urun.stok -= 1;
      urunleriKaydet(products);

      return interaction.editReply(`✅ ${isim} satın alındı. Kalan stok: ${urun.stok}`);
    }

    // ===== DUYURU =====
    if (interaction.commandName === "duyuru") {

      const mesaj = interaction.options.getString("mesaj");

      const embed = new EmbedBuilder()
        .setTitle("🚀 YENİ DUYURU")
        .setDescription(`✨ ${mesaj}`)
        .setColor("#ff9900")
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

      return interaction.editReply("✅ Premium duyuru gönderildi.");
    }

  } catch (err) {
    console.error("Interaction hata:", err);

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: "❌ Bir hata oluştu.", ephemeral: true });
    } else {
      await interaction.reply({ content: "❌ Bir hata oluştu.", ephemeral: true });
    }
  }
});

client.login(TOKEN);
