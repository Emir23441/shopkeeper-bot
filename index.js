import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} from "discord.js";
import dotenv from "dotenv";

dotenv.config();

/* ================= BOT AYARLARI ================= */

const TOKEN = process.env.MTQ3MzcwMTk4MzMxODgzOTM4OA.GLoX8U.Q9mER4YmBMlz47xchDjRWDhXXRqwIktSrXFS_k;
const CLIENT_ID = process.env.1473701983318839388;
const GUILD_ID = process.env.1473716394217570483;
const ITEMSATIS_LINK = https://www.itemsatis.com/profil/shopkeeperdiscord.html;

/* ================= CLIENT ================= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ================= SLASH KOMUTLAR ================= */

const commands = [

  new SlashCommandBuilder()
    .setName("market")
    .setDescription("Ürünleri listeler"),

  new SlashCommandBuilder()
    .setName("satinal")
    .setDescription("İtemSatış linkini atar"),

  new SlashCommandBuilder()
    .setName("yardım")
    .setDescription("Satın alma sürecini anlatır"),

  new SlashCommandBuilder()
    .setName("stok-durumu")
    .setDescription("Stok bilgisi verir"),

  new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("Kampanya duyurusu yapar")
    .addStringOption(option =>
      option.setName("mesaj")
        .setDescription("Duyuru mesajı")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("fiyat-hesapla")
    .setDescription("İndirimli fiyatı hesaplar")
    .addNumberOption(option =>
      option.setName("fiyat")
        .setDescription("Ürün fiyatı")
        .setRequired(true))
    .addNumberOption(option =>
      option.setName("indirim")
        .setDescription("İndirim yüzdesi")
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName("aktif-saatler")
    .setDescription("Teslimat saatlerini gösterir"),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Bot gecikmesini gösterir")

].map(command => command.toJSON());

/* ================= KOMUT YÜKLEME ================= */

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Slash komutları yüklendi.");
  } catch (error) {
    console.error(error);
  }
})();

/* ================= KOMUT ÇALIŞTIRMA ================= */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  /* MARKET */
  if (interaction.commandName === "market") {
    const embed = new EmbedBuilder()
      .setTitle("🛒 Market Ürünleri")
      .setDescription(`
• 🎮 Valorant VP  
• 🎁 Steam Random Key  
• 💎 Discord Nitro  
• 🔐 Oyun Hesapları  
`)
      .setColor("Blue");

    await interaction.reply({ embeds: [embed] });
  }

  /* SATINAL */
  if (interaction.commandName === "satinal") {
    await interaction.reply(`🛒 Satın almak için: ${ITEMSATIS_LINK}`);
  }

  /* YARDIM */
  if (interaction.commandName === "yardım") {
    await interaction.reply(`
📌 Satın Alma Süreci:

1️⃣ Ürünü seç  
2️⃣ İtemSatış üzerinden satın al  
3️⃣ Sipariş numaranı bize ilet  
4️⃣ Teslimatı hızlıca al 🚀
`);
  }

  /* STOK */
  if (interaction.commandName === "stok-durumu") {
    await interaction.reply(`
📦 Güncel Stok:

Valorant VP: ✅ Var  
Steam Key: ✅ Var  
Discord Nitro: ❌ Tükendi  
`);
  }

  /* DUYURU */
  if (interaction.commandName === "duyuru") {
    const mesaj = interaction.options.getString("mesaj");

    const embed = new EmbedBuilder()
      .setTitle("📢 Kampanya Duyurusu")
      .setDescription(mesaj)
      .setColor("Gold")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  /* FİYAT HESAPLA */
  if (interaction.commandName === "fiyat-hesapla") {
    const fiyat = interaction.options.getNumber("fiyat");
    const indirim = interaction.options.getNumber("indirim");

    const indirimli = fiyat - (fiyat * indirim / 100);

    await interaction.reply(`
💰 Normal Fiyat: ${fiyat}₺
🔥 İndirim: %${indirim}
✅ İndirimli Fiyat: ${indirimli.toFixed(2)}₺
`);
  }

  /* AKTİF SAATLER */
  if (interaction.commandName === "aktif-saatler") {
    await interaction.reply(`
🕒 Aktif Teslimat Saatleri:

Hafta içi: 19:00 - :21:00  
Hafta sonu: 12:00 - 22:00  

⚡ Çoğu sipariş 5-15 dk içinde teslim edilir.
`);
  }

  /* PING */
  if (interaction.commandName === "ping") {
    await interaction.reply(`🏓 Pong! Gecikme: ${client.ws.ping}ms`);
  }
});

/* ================= BOT BAŞLAT ================= */

client.login(TOKEN);
