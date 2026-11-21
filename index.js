// ==========================================
// SUP PROJECTS · DESTEK (TICKET) BOTU
// Kurulum: README.md
// ==========================================

const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  ContainerBuilder,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  InteractionContextType,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits: P,
  PermissionsBitField,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const A = require("./ayarlar");

const TOKEN = process.env.TOKEN;
if (!TOKEN || TOKEN.includes("BURAYA")) {
  console.error("\n❌ Bot tokeni bulunamadı.\n   .env dosyasını aç, TOKEN= satırına botunun tokenini yapıştır ve tekrar başlat.\n");
  process.exit(1);
}

const GIZLI = { flags: MessageFlags.Ephemeral };
const STIL = { mavi: ButtonStyle.Primary, yesil: ButtonStyle.Success, kirmizi: ButtonStyle.Danger, gri: ButtonStyle.Secondary };
const kategoriBul = (id) => A.KATEGORILER.find((k) => k.id === id);

// ==========================================
// VERİ (data.json, bot ilk açılışta kendisi oluşturur)
// ==========================================

const VERI_DOSYASI = path.join(__dirname, "data.json");
let veri = { sunucular: {} };
try {
  veri = JSON.parse(fs.readFileSync(VERI_DOSYASI, "utf8"));
} catch {}

function kaydet() {
  fs.writeFileSync(VERI_DOSYASI + ".tmp", JSON.stringify(veri, null, 2));
  fs.renameSync(VERI_DOSYASI + ".tmp", VERI_DOSYASI);
}
function sunucu(id) {
  veri.sunucular[id] ??= { ayar: null, talepler: {} };
  return veri.sunucular[id];
}

// ==========================================
// YARDIMCILAR
// ==========================================

function yetkiliMi(member, ayar) {
  if (!member) return false;
  if (member.permissions.has(P.ManageGuild)) return true;
  return !!ayar && member.roles.cache.has(ayar.yetkiliRolu);
}

function altBilgi(client) {
  return { text: `${A.MARKA} • Destek Sistemi`, iconURL: client.user.displayAvatarURL() };
}

function markaButonu() {
  if (!A.DAVET_LINKI) return null;
  return new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel(A.MARKA).setEmoji("🔗").setURL(A.DAVET_LINKI).setStyle(ButtonStyle.Link));
}

function sure(ms) {
  const dk = Math.floor(ms / 60000);
  const sn = Math.floor((ms % 60000) / 1000);
  if (dk >= 60) return `${Math.floor(dk / 60)} saat ${dk % 60} dakika`;
  return dk > 0 ? `${dk} dakika ${sn} saniye` : `${sn} saniye`;
}

const tarih = (ms) => new Date(ms).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

function kanalAdi(kullaniciAdi) {
  const temiz = kullaniciAdi
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  return `destek-${temiz || "talep"}`;
}

/** Bu kişinin gerçekten açık olan talebi (kanalı elle silinmişse kayıttan düşer). */
function acikTalep(guild, userId) {
  const s = sunucu(guild.id);
  for (const [kanalId, t] of Object.entries(s.talepler)) {
    if (t.sahipId !== userId) continue;
    if (guild.channels.cache.has(kanalId)) return kanalId;
    delete s.talepler[kanalId];
    kaydet();
  }
  return null;
}

const GEREKEN_IZINLER = [
  [P.ViewChannel, "Kanalları Görüntüle"],
  [P.ManageChannels, "Kanalları Yönet"],
  [P.ManageRoles, "Rolleri Yönet"],
  [P.SendMessages, "Mesaj Gönder"],
  [P.EmbedLinks, "Bağlantı Yerleştir"],
  [P.AttachFiles, "Dosya Ekle"],
  [P.ReadMessageHistory, "Mesaj Geçmişini Oku"],
  [P.ManageMessages, "Mesajları Yönet"],
];

// ==========================================
// KOMUTLAR
// ==========================================

const komutlar = [
  new SlashCommandBuilder()
    .setName("kurulum")
    .setDescription("Destek sistemini kurar: yetkili rolü, kategori ve log kanalı.")
    .setDefaultMemberPermissions(P.Administrator)
    .setContexts(InteractionContextType.Guild)
    .addRoleOption((o) => o.setName("yetkili-rolu").setDescription("Taleplere bakacak yetkili rolü").setRequired(true))
    .addChannelOption((o) => o.setName("kategori").setDescription("Taleplerin açılacağı kategori (boş bırakırsan yenisi açılır)").addChannelTypes(ChannelType.GuildCategory))
    .addChannelOption((o) => o.setName("log-kanali").setDescription("Kapanan taleplerin kaydı (boş bırakırsan yenisi açılır)").addChannelTypes(ChannelType.GuildText)),
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Destek panelini bu kanala gönderir.")
    .setDefaultMemberPermissions(P.ManageGuild)
    .setContexts(InteractionContextType.Guild),
].map((k) => k.toJSON());

async function kurulum(i) {
  const eksik = GEREKEN_IZINLER.filter(([izin]) => !i.guild.members.me.permissions.has(izin)).map(([, ad]) => ad);
  if (eksik.length) return i.reply({ ...GIZLI, content: `Botun şu izinlere ihtiyacı var: **${eksik.join(", ")}**\nBotun rolüne bu izinleri verip tekrar dene.` });
  await i.deferReply(GIZLI);

  const guild = i.guild;
  const rol = i.options.getRole("yetkili-rolu", true);
  const gizli = [
    { id: guild.roles.everyone.id, deny: [P.ViewChannel] },
    { id: rol.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] },
    { id: guild.members.me.id, allow: [P.ViewChannel, P.SendMessages, P.ManageChannels, P.EmbedLinks, P.AttachFiles, P.ReadMessageHistory] },
  ];

  const kategori = i.options.getChannel("kategori") ?? (await guild.channels.create({ name: "🎫 Destek Talepleri", type: ChannelType.GuildCategory, permissionOverwrites: gizli }));
  const log = i.options.getChannel("log-kanali") ?? (await guild.channels.create({ name: "destek-log", type: ChannelType.GuildText, parent: kategori.id, permissionOverwrites: gizli }));

  sunucu(guild.id).ayar = { yetkiliRolu: rol.id, kategori: kategori.id, log: log.id };
  kaydet();

  return i.editReply(
    `✅ **Kurulum tamam!**\n` +
      `• Yetkili rolü: ${rol}\n` +
      `• Talepler şu kategoride açılacak: **${kategori.name}**\n` +
      `• Konuşma kayıtları: ${log}\n\n` +
      `Şimdi paneli koymak istediğin kanala gidip **/panel** yaz.`,
  );
}

async function panel(i) {
  if (!sunucu(i.guildId).ayar) return i.reply({ ...GIZLI, content: "Önce **/kurulum** komutunu çalıştır." });

  // Discord'un yeni mesaj düzeni: her kategorinin açıklaması solda, butonu hemen yanında
  const kutu = new ContainerBuilder().setAccentColor(parseInt(A.RENK.replace("#", ""), 16));

  if (A.PANEL_RESMI) kutu.addMediaGalleryComponents((g) => g.addItems((r) => r.setURL(A.PANEL_RESMI)));

  kutu.addTextDisplayComponents((t) =>
    t.setContent(
      `## 📩 ${A.MARKA} | ${A.PANEL_BASLIK}\n${A.PANEL_ACIKLAMA}` +
        (A.CEVAP_SURESI ? `\nOrtalama cevap süresi: **${A.CEVAP_SURESI}**` : "") +
        `\n\n**Lütfen talep oluşturmadan önce doğru kategoriyi seçtiğinizden emin olun.**`,
    ),
  );

  for (const k of A.KATEGORILER.slice(0, 10)) {
    kutu.addSectionComponents((bolum) =>
      bolum
        .addTextDisplayComponents((t) => t.setContent(`${k.emoji} **${k.isim}**\n${k.aciklama}`))
        .setButtonAccessory((b) => b.setCustomId(`talep_ac_${k.id}`).setLabel((k.buton || k.isim).slice(0, 80)).setEmoji({ name: k.emoji }).setStyle(STIL[k.stil] ?? ButtonStyle.Secondary)),
    );
  }

  kutu.addTextDisplayComponents((t) => t.setContent(`⚠️ **Not:** ${A.PANEL_NOT}\n-# ${A.MARKA} • Destek Sistemi`));

  await i.channel.send({ components: [kutu], flags: MessageFlags.IsComponentsV2 });
  return i.reply({ ...GIZLI, content: "Panel gönderildi." });
}

// ==========================================
// TALEP AÇMA
// ==========================================

const acilanlar = new Set(); // aynı anda iki talep açılmasını önler

async function talepFormu(i) {
  const ayar = sunucu(i.guildId).ayar;
  const kategori = kategoriBul(i.customId.replace("talep_ac_", ""));
  if (!ayar) return i.reply({ ...GIZLI, content: "Destek sistemi henüz kurulmamış. Yetkililere haber ver." });
  if (!kategori) return i.reply({ ...GIZLI, content: "Bu kategori artık yok. Yetkililerden paneli yenilemesini iste." });

  const acik = acikTalep(i.guild, i.user.id);
  if (acik) return i.reply({ ...GIZLI, content: `Zaten açık bir destek talebin var: <#${acik}>` });

  const form = new ModalBuilder()
    .setCustomId(`talep_form_${kategori.id}`)
    .setTitle(kategori.isim.slice(0, 45))
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("aciklama")
          .setLabel("Açıklama / Sorununuz nedir?")
          .setPlaceholder("Destek talebini neden açtığını olabildiğince açık anlat.")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000),
      ),
    );
  return i.showModal(form);
}

async function talepAc(i) {
  const guild = i.guild;
  const user = i.user;
  const ayar = sunucu(guild.id).ayar;
  const kategori = kategoriBul(i.customId.replace("talep_form_", ""));
  if (!ayar || !kategori) return i.reply({ ...GIZLI, content: "Talep açılamadı. Yetkililere haber ver." });

  const kilit = `${guild.id}:${user.id}`;
  const acik = acikTalep(guild, user.id);
  if (acik || acilanlar.has(kilit)) return i.reply({ ...GIZLI, content: acik ? `Zaten açık bir destek talebin var: <#${acik}>` : "Talebin zaten oluşturuluyor." });
  acilanlar.add(kilit);

  try {
    await i.reply({ ...GIZLI, content: "⏳ Destek talebin oluşturuluyor..." });
    const aciklama = i.fields.getTextInputValue("aciklama");

    const kanal = await guild.channels.create({
      name: kanalAdi(user.username),
      type: ChannelType.GuildText,
      parent: ayar.kategori,
      topic: `${kategori.isim} · ${user.tag} (${user.id})`,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [P.ViewChannel] },
        { id: user.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks] },
        { id: ayar.yetkiliRolu, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks, P.ManageMessages] },
        { id: guild.members.me.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks, P.ManageChannels, P.ManageMessages] },
      ],
    });

    sunucu(guild.id).talepler[kanal.id] = {
      sahipId: user.id,
      sahipTag: user.tag,
      acilis: Date.now(),
      kategori: kategori.isim,
      aciklama,
      ustlenenId: null,
      ustlenenTag: null,
    };
    kaydet();

    const mesaj = await kanal.send({
      content: `${user} <@&${ayar.yetkiliRolu}>`,
      embeds: [bilgiKarti(i.client, sunucu(guild.id).talepler[kanal.id])],
      components: [talepButonlari(null)],
      allowedMentions: { users: [user.id], roles: [ayar.yetkiliRolu] },
    });
    await mesaj.pin().catch(() => {});

    await i.editReply({ content: `✅ Destek talebiniz oluşturuldu: ${kanal}`, embeds: [] });
  } finally {
    acilanlar.delete(kilit);
  }
}

function bilgiKarti(client, t) {
  return new EmbedBuilder()
    .setColor(A.RENK)
    .setTitle(`📋 Destek Talebi: ${t.kategori}`)
    .setDescription(
      `👤 **Oluşturan:** <@${t.sahipId}> (${t.sahipId})\n` +
        `🏷️ **Kategori:** ${t.kategori}\n` +
        `🕒 **Açılış:** <t:${Math.floor(t.acilis / 1000)}:F>\n` +
        `🙋 **Üstlenen yetkili:** ${t.ustlenenId ? `<@${t.ustlenenId}>` : "Henüz kimse üstlenmedi"}\n` +
        `📝 **Açıklama:** ${t.aciklama}`,
    )
    .setFooter(altBilgi(client));
}

function talepButonlari(ustlenenAdi) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("talep_ustlen")
      .setLabel(ustlenenAdi ? `${ustlenenAdi} ilgileniyor`.slice(0, 80) : "Üstlen")
      .setEmoji("🙋")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!!ustlenenAdi),
    new ButtonBuilder().setCustomId("talep_ekle").setLabel("Kullanıcı Ekle").setEmoji("➕").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("talep_kapat").setLabel("Talebi Kapat").setEmoji("🔒").setStyle(ButtonStyle.Danger),
  );
}

// ==========================================
// TALEP İÇİ BUTONLAR
// ==========================================

function talepVeYetki(i, sadeceYetkili) {
  const s = sunucu(i.guildId);
  const t = s.talepler[i.channelId];
  if (!t) return { hata: "Bu kanal aktif bir destek talebi değil." };
  const yetkili = yetkiliMi(i.member, s.ayar);
  if (sadeceYetkili && !yetkili) return { hata: "Bu işlemi sadece yetkililer yapabilir." };
  if (!sadeceYetkili && !yetkili && t.sahipId !== i.user.id) return { hata: "Bu işlemi sadece talebi açan kişi ya da yetkililer yapabilir." };
  return { t, ayar: s.ayar };
}

async function ustlen(i) {
  const { t, hata } = talepVeYetki(i, true);
  if (hata) return i.reply({ ...GIZLI, content: hata });
  if (t.ustlenenId) return i.reply({ ...GIZLI, content: `Bu talebi zaten ${t.ustlenenTag} üstlendi.` });

  t.ustlenenId = i.user.id;
  t.ustlenenTag = i.user.tag;
  kaydet();
  await i.update({ embeds: [bilgiKarti(i.client, t)], components: [talepButonlari(i.user.username)] });
  return i.channel.send(`🙋 Bu destek talebi **${i.user}** tarafından üstlenildi.`);
}

async function ekleMenusu(i) {
  const { hata } = talepVeYetki(i, false);
  if (hata) return i.reply({ ...GIZLI, content: hata });
  const menu = new UserSelectMenuBuilder().setCustomId("talep_ekle_sec").setPlaceholder("Talebe eklenecek kişileri seç...").setMinValues(1).setMaxValues(10);
  return i.reply({ ...GIZLI, content: "Eklemek istediğin kişileri seç:", components: [new ActionRowBuilder().addComponents(menu)] });
}

async function ekle(i) {
  const { hata } = talepVeYetki(i, false);
  if (hata) return i.reply({ ...GIZLI, content: hata });
  for (const id of i.values) {
    await i.channel.permissionOverwrites.edit(id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true });
  }
  const etiketler = i.values.map((id) => `<@${id}>`).join(", ");
  await i.update({ content: `✅ Eklendi: ${etiketler}`, components: [] });
  return i.channel.send(`➕ ${i.user} tarafından ${etiketler} destek talebine eklendi.`);
}

// ==========================================
// TALEP KAPATMA
// ==========================================

async function kapatmaFormu(i) {
  const { hata } = talepVeYetki(i, false);
  if (hata) return i.reply({ ...GIZLI, content: hata });
  const form = new ModalBuilder()
    .setCustomId("talep_kapat_form")
    .setTitle("Destek Talebini Kapat")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("sebep").setLabel("Kapatma sebebi (isteğe bağlı)").setPlaceholder("Boş bırakabilir veya sebep yazabilirsin...").setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(150),
      ),
    );
  return i.showModal(form);
}

async function tumMesajlar(kanal) {
  const hepsi = [];
  let once;
  for (let n = 0; n < 50; n++) {
    const paket = await kanal.messages.fetch({ limit: 100, before: once }).catch(() => null);
    if (!paket || paket.size === 0) break;
    hepsi.push(...paket.values());
    once = paket.last().id;
    if (paket.size < 100) break;
  }
  return hepsi.reverse();
}

async function kapat(i) {
  const { t, ayar, hata } = talepVeYetki(i, false);
  if (hata) return i.reply({ ...GIZLI, content: hata });
  if (t.kapaniyor && Date.now() - t.kapaniyor < 60000) return i.reply({ ...GIZLI, content: "Talep zaten kapatılıyor." });
  t.kapaniyor = Date.now();
  kaydet();

  await i.reply({ ...GIZLI, content: "Talep kapatılıyor..." });
  const sebep = i.fields.getTextInputValue("sebep") || "Belirtilmedi";
  const { guild, channel, user } = i;
  await channel.send(`🔒 Destek talebi **${user.tag}** tarafından kapatılıyor...`).catch(() => {});

  // KONUŞMA KAYDI: bütün mesajlar, ekler dahil
  const mesajlar = await tumMesajlar(channel);
  let kayit =
    `${A.MARKA} - DESTEK TALEBİ KONUŞMA KAYDI\n` +
    `Sunucu: ${guild.name}\nKanal: ${channel.name}\nKategori: ${t.kategori}\n` +
    `Açan: ${t.sahipTag}\nKapatan: ${user.tag}\nSebep: ${sebep}\n` +
    `==========================================\n\n`;
  for (const m of mesajlar) {
    const ekler = [...m.attachments.values()].map((e) => ` [Ek: ${e.url}]`).join("");
    const embedler = m.embeds.map((e) => ` [${e.title || e.description?.slice(0, 80) || "Embed"}]`).join("");
    kayit += `[${tarih(m.createdTimestamp)}] ${m.author.tag}: ${m.content}${embedler}${ekler}\n`;
  }
  const dosya = () => new AttachmentBuilder(Buffer.from(kayit, "utf-8"), { name: `${channel.name}-kayit.txt` });

  const kapanis = Date.now();
  const yazilan = mesajlar.filter((m) => !m.author.bot).length;
  const ozet =
    "```\n" +
    `Talebi açan      : ${t.sahipTag}\n` +
    `Kategori         : ${t.kategori}\n` +
    `Üstlenen yetkili : ${t.ustlenenTag ?? "Kimse üstlenmedi"}\n` +
    `Kapatan          : ${user.tag}\n` +
    `Açılış           : ${tarih(t.acilis)}\n` +
    `Kapanış          : ${tarih(kapanis)}\n` +
    `Geçen süre       : ${sure(kapanis - t.acilis)}\n` +
    `Yazılan mesaj    : ${yazilan}\n` +
    `Kapanma sebebi   : ${sebep}\n` +
    "```";

  // LOG KANALINA (yetkililer için kalıcı kopya)
  const log = guild.channels.cache.get(ayar.log);
  await log?.send({
    embeds: [new EmbedBuilder().setColor(A.RENK).setTitle(`🔒 Talep kapandı: ${channel.name}`).setDescription(ozet).setFooter(altBilgi(i.client)).setTimestamp()],
    files: [dosya()],
  }).catch(() => {});

  // TALEBİ AÇANA ÖZELDEN
  const sahip = await i.client.users.fetch(t.sahipId).catch(() => null);
  if (sahip) {
    const dm = new EmbedBuilder()
      .setColor(A.RENK)
      .setTitle(`📋 ${guild.name}`)
      .setDescription(
        `Açtığın destek talebi kapatıldı. Bilgileri aşağıda bulabilirsin.\n\n${ozet}\n` +
          `📎 Konuşma kaydı ekteki dosyada.`,
      )
      .setFooter(altBilgi(i.client))
      .setTimestamp();
    const buton = markaButonu();
    await sahip.send({ embeds: [dm], files: [dosya()], components: buton ? [buton] : [] }).catch(() => {});
  }

  // KANAL SİLİNİR
  delete sunucu(guild.id).talepler[channel.id];
  kaydet();
  await bekle(3000);
  await channel.delete().catch(() => {});
}

// ==========================================
// BOT
// ==========================================

// MessageContent: konuşma kaydında mesajların yazısının görünmesi için gerekli
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, async (c) => {
  await c.application.commands.set(komutlar);
  const izinler = new PermissionsBitField(GEREKEN_IZINLER.map(([izin]) => izin)).bitfield;
  console.log(`\n✅ ${c.user.tag} aktif! ${A.MARKA} destek sistemi hazır.`);
  console.log(`\n   Botu sunucuna eklemek için bu linke tıkla:\n   https://discord.com/oauth2/authorize?client_id=${c.user.id}&scope=bot+applications.commands&permissions=${izinler}`);
  console.log(`\n   Sonra sunucunda /kurulum yaz.\n`);
});

// talep kanalı elle silinirse kayıttan da düşer
client.on(Events.ChannelDelete, (kanal) => {
  const s = kanal.guildId && veri.sunucular[kanal.guildId];
  if (s?.talepler?.[kanal.id]) {
    delete s.talepler[kanal.id];
    kaydet();
  }
});

client.on(Events.InteractionCreate, async (i) => {
  try {
    if (!i.inGuild()) return;

    if (i.isChatInputCommand()) {
      if (i.commandName === "kurulum") return await kurulum(i);
      if (i.commandName === "panel") return await panel(i);
    }
    if (i.isButton()) {
      if (i.customId.startsWith("talep_ac_")) return await talepFormu(i);
      if (i.customId === "talep_ustlen") return await ustlen(i);
      if (i.customId === "talep_ekle") return await ekleMenusu(i);
      if (i.customId === "talep_kapat") return await kapatmaFormu(i);
    }
    if (i.isUserSelectMenu() && i.customId === "talep_ekle_sec") return await ekle(i);
    if (i.isModalSubmit()) {
      if (i.customId.startsWith("talep_form_")) return await talepAc(i);
      if (i.customId === "talep_kapat_form") return await kapat(i);
    }
  } catch (hata) {
    console.error("Hata:", hata);
    const mesaj = { ...GIZLI, content: "Bir hata oluştu. Botun izinlerini kontrol et; sorun devam ederse konsoldaki hatayı yetkiliye ilet." };
    if (i.isRepliable()) await (i.replied || i.deferred ? i.followUp(mesaj) : i.reply(mesaj)).catch(() => {});
  }
});

client.login(TOKEN).catch((hata) => {
  const h = String(hata);
  if (h.includes("disallowed intents")) {
    console.error("\n❌ Discord botu başlatmadı: Message Content Intent kapalı.\n   Developer Portal → botun → Bot → \"Message Content Intent\" anahtarını aç ve tekrar başlat.\n");
  } else if (h.includes("TokenInvalid") || h.includes("invalid token")) {
    console.error("\n❌ Token geçersiz. .env dosyasındaki TOKEN değerini kontrol et.\n");
  } else {
    console.error(hata);
  }
  process.exit(1);
});
