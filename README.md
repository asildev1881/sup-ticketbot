# SUP PROJECTS · Destek Botu

Türkçe, ücretsiz ticket (destek talebi) botu. Kod bilmeden kurulur, her şey sunucu içinden komutla ayarlanır.

## Özellikler

- Butonlu destek paneli: her kategori kendi butonu ve açıklamasıyla
- Talep açarken kısa açıklama formu
- Talep kanalında: **Üstlen**, **Kullanıcı Ekle**, **Talebi Kapat**
- Kapanınca bütün konuşma kaydı (ekler dahil) log kanalına ve talebi açan kişiye gider

Sesli destek odası, puanlama sistemi ya da sunucuna özel tasarım istersen SUP PROJECTS sunucusundan ulaş.

## Kurulum (5 dakika)

**Gerekenler:** Bilgisayarda [Node.js](https://nodejs.org) (LTS sürümü) kurulu olmalı.

### 1. Botu oluştur

1. [Discord Developer Portal](https://discord.com/developers/applications) → **New Application** → bir isim ver.
2. Soldan **Bot** sekmesi:
   - **Reset Token** de ve çıkan tokeni kopyala. Bu botun şifresidir, **kimseyle paylaşma**.
   - Aşağıdaki **Message Content Intent** anahtarını aç.

### 2. İndir

Bu sayfanın üstündeki yeşil **Code** butonu → **Download ZIP**. Zip'i bir klasöre çıkar.

### 3. Tokeni yapıştır ve başlat

- **Windows:** `baslat.bat` dosyasına çift tıkla. İlk seferde Not Defteri açılır; `TOKEN=` satırına tokeni yapıştır, kaydet ve `baslat.bat`'a tekrar tıkla.
- **Linux / VDS:** `./baslat.sh` çalıştır, oluşan `.env` dosyasına tokeni yaz, tekrar çalıştır.

İlk açılışta gerekli dosyaları kendisi indirir. Açılınca ekranda botu sunucuna eklemen için bir link çıkar. Linke tıkla ve sunucunu seç.

### 4. Sunucuda ayarla

```
/kurulum yetkili-rolu:@Yetkili
```

Kategori ve log kanalını istersen kendin seçebilirsin; boş bırakırsan bot kendisi açar. Sonra paneli koymak istediğin kanala gidip şunu yaz:

```
/panel
```

Bitti.

## Görünümü değiştirme

`ayarlar.js` dosyasını Not Defteri ile aç. Marka adı, renk, davet linki, panel yazıları ve kategoriler orada. Sadece tırnak içindekileri değiştir, kaydet, botu kapatıp aç, sonra `/panel` yaz.

## Sık sorulanlar

**"Message Content Intent kapalı" diyor:** Developer Portal → Bot → Message Content Intent anahtarını aç.

**"Botun şu izinlere ihtiyacı var" diyor:** Sunucu Ayarları → Roller → botun rolü → yazan izinleri aç.

**Bilgisayarı kapatınca bot da kapanıyor:** 7/24 açık kalması için VDS ya da bot hosting gerekir.

**Verilerim nerede?** Klasördeki `data.json` dosyasında. Bot kapanıp açılınca kaldığı yerden devam eder; bu dosyayı silme.

---

## Lisans

[PolyForm Noncommercial 1.0.0](LICENSE.md). Kısaca:

- ✅ Botu ücretsiz kullanabilir, kendi sunucunda çalıştırabilir, kodunu değiştirebilirsin.
- ✅ Değiştirdiğin hali de ücretsiz paylaşabilirsin; lisans dosyasını ve telif satırını silmeden.
- ❌ Botu ya da kodunu **satamazsın**, paralı bir hizmetin parçası yapamazsın.

Ticari kullanım için SUP PROJECTS'ten izin al.

---

SUP PROJECTS tarafından ücretsiz olarak paylaşılmıştır.
