// ==========================================
// SUP PROJECTS DESTEK BOTU · AYARLAR
// Sadece tırnak içindeki yazıları değiştir, kaydet, botu yeniden başlat.
// Rol, kategori ve log kanalı burada değil; sunucuda /kurulum ile seçilir.
// ==========================================

module.exports = {
  // Mesajların altında ve butonlarda görünen marka adı
  MARKA: "SUP PROJECTS",

  // Mesaj kutularının rengi
  RENK: "#0099FF",

  // Kapanış mesajındaki butonun götüreceği Discord davet linki (boş bırakılırsa buton çıkmaz)
  DAVET_LINKI: "",

  // Panelde, açıklamaların altında duran resim (dosyanın tam linki). Boş bırakılabilir.
  PANEL_RESMI: "",

  // Panel başlığı ve açıklaması
  PANEL_BASLIK: "Destek Paneli",
  PANEL_ACIKLAMA:
    "Merhaba! Aşağıdaki kategorilerden ilgili seçeneği seçerek destek talebi oluşturabilirsiniz. Destek talepleriniz en kısa sürede incelenecektir.",
  // Panelde gösterilen ortalama cevap süresi (boş bırakırsan gösterilmez)
  CEVAP_SURESI: "5 dakika",

  PANEL_NOT:
    "Destek sistemi yalnızca gerekli durumlarda kullanılmalıdır. Yetkiliyle sohbet etmek, ücretsiz bot istemek gibi amaçlarla açılan talepler yaptırıma tabi tutulabilir.",

  // Destek kategorileri. En fazla 10 tane olabilir.
  // buton: butonun üstündeki yazı (hepsi aynı olursa butonlar eşit boyda durur) · stil: "mavi", "yesil", "kirmizi" ya da "gri"
  KATEGORILER: [
    { id: "teknik", buton: "Talep Oluştur", emoji: "🛠️", isim: "Teknik Destek", aciklama: "Kurulum işlemleri, gecikme sorunları, hata/bug gibi sorunlar için.", stil: "kirmizi" },
    { id: "sure", buton: "Talep Oluştur", emoji: "⏳", isim: "Hizmet Süre Uzatma", aciklama: "Hizmetlerinizin süresini uzatmak istediğinizde.", stil: "yesil" },
    { id: "is", buton: "Talep Oluştur", emoji: "🤝", isim: "İş Birliği & Reklam", aciklama: "Sponsorluk teklifleri, reklam veya tanıtım talepleri için.", stil: "mavi" },
    { id: "botteknik", buton: "Talep Oluştur", emoji: "🤖", isim: "Bot Teknik Destek", aciklama: "Botlarınızda çıkan teknik sorunlar için.", stil: "gri" },
    { id: "satis", buton: "Talep Oluştur", emoji: "💳", isim: "Satın Alım & Ödeme", aciklama: "Satın alımlar, ödeme bilgileri, iade vb. işlemler için.", stil: "gri" },
  ],
};
