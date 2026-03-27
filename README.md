# OmniConvert: Client-Side TIFF Converter (PoC)

Bu proje, belge ve görüntü dosyalarını (JPG, PNG, PDF) sunucuya (backend) göndermeden, doğrudan kullanıcının tarayıcısında (Client-Side) TIFF formatına dönüştürmek amacıyla geliştirilmiş bir **Kavram Kanıtlama (Proof of Concept - PoC)** çalışmasıdır. 

Projenin temel motivasyonu; yüksek hacimli dosya dönüşümlerinde oluşan sunucu (CPU/RAM) maliyetlerini sıfırlamak ve dosyaların sunucuya yüklenmesi/indirilmesi sırasında oluşan ağ gecikmesini (Network Latency) ortadan kaldırmaktır.

## 🚀 Temel Özellikler

* **Sıfır Sunucu Maliyeti (Zero Server Cost):** Tüm dönüştürme işlemleri kullanıcının cihazındaki tarayıcı belleği (RAM) ve işlemcisi kullanılarak yapılır.
* **Sıfır Ağ Gecikmesi (Zero Network Latency):** Dosyalar fiziksel bir sunucuya yüklenmez (Upload/Download yoktur). HTML5 `FileReader` ve `Blob` API'leri ile doğrudan sanal bellek üzerinden işlenir.
* **Non-Blocking UI (Web Workers):** Ağır TIFF kodlama (Encoding) işlemleri Ana İş Parçacığını (Main Thread) kilitlememesi için HTML5 Web Worker'lara devredilmiştir. Dönüşüm sırasında arayüz donmaz.
* **Güvenlik (Privacy by Design):** Dosyalar kullanıcı cihazından dışarı çıkmadığı için KVKK/GDPR uyumluluğu %100 oranında, doğal yollardan sağlanır.

## 🏗️ Mimari ve Teknolojiler

Proje, modern frontend standartlarına ve Clean Architecture prensiplerine uygun olarak tasarlanmıştır:

* **Framework:** Angular 17+ (Modülsüz / Standalone Components mimarisi).
* **Stil & UI:** Tailwind CSS (Reaktif ve sürükle-bırak destekli arayüz için).
* **Dizin Yapısı:** * `core/engines/`: Dönüşüm algoritmalarının bulunduğu iş mantığı katmanı.
  * `core/workers/`: CPU yoğunluklu işleri üstlenen arka plan işlemcileri.
  * `features/converter-ui/`: Kullanıcı etkileşiminin yönetildiği arayüz bileşenleri.

### Dönüşüm Motorları (Engines)
1. **UTIF / WebAssembly (WASM) Engine:** Tarayıcıda yerleşik bir TIFF dönüştürücü olmadığı için Raster (JPG/PNG) dosyaları gizli bir HTML5 `<canvas>` öğesine çizilir. `getImageData` ile alınan ham piksel (RGBA) verileri, UTIF.js ve WASM kullanılarak TIFF formatına kodlanır.
2. **PDF Engine:** `pdf.js` kütüphanesi kullanılarak PDF sayfaları sırayla Canvas'a render edilir ve piksel verileri alınarak birleştirilir.

## 🧠 Performans ve Bellek Yönetimi (Memory Management)

İstemci tarafında ağır görüntü işleme operasyonları yapıldığı için tarayıcı limitlerini aşmamak adına özel optimizasyonlar uygulanmıştır:

* **Transferable Objects (Zero-Copy):** Dev boyuttaki `ArrayBuffer` verileri Main Thread ile Web Worker arasında aktarılırken `postMessage` ile klonlanmaz. Kopyalama kaynaklı bellek (RAM) şişmelerini engellemek için veri sahipliği doğrudan devredilir.
* **Manuel Garbage Collection (Çöp Toplama):** Çok sayfalı PDF dosyaları işlenirken her sayfa render edildikten sonra `<canvas>` referansları anında `null` değerine çekilir ve DOM'dan izole edilerek tarayıcının belleği şişirmesi (Memory Leak) engellenir.

## 📊 PoC Sonuçları ve Çıkarımlar

Bu proje kapsamında yapılan testler ve benchmark ölçümleri sonucunda elde edilen mimari bulgular şunlardır:

* **Raster İşlemleri (JPG/PNG) Başarılı:** Küçük ve orta boyutlu resim dosyaları tarayıcıda milisaniyeler (ms) içinde işlenmektedir. Ağ gecikmesi olmadığı için sunucu tabanlı (Backend) bir dönüşümden çok daha hızlı ve verimlidir. İstemci mimarisi bu formatlar için idealdir.
* **PDF RAM Darboğazı:** Çok sayfalı ve yüksek çözünürlüklü PDF dosyalarının tarayıcıda Canvas'a render edilmesi, tarayıcıların sekme başı RAM limitlerini (yaklaşık 1.5 - 2 GB) zorlamakta ve "Aw, Snap!" (Çökme) riskini barındırmaktadır. Ayrıca saf `CCITT4` (Faks) standardında 1-bit kayıpsız siyah/beyaz sıkıştırma işlemleri tarayıcı ekosisteminde yeterince efektif değildir.
* **Office Formatları (DOCX/XLSX) Kısıtı:** Microsoft Word veya Excel dosyalarının mizanpajını (sayfa yapısı, fontlar, tablolar) tarayıcıda %100 sadakatle çizebilecek (Render) bir istemci motoru bulunmamaktadır.

**Nihai Karar:** Bu PoC sonucunda, JPG/PNG gibi hafif dosyaların bu repodaki **Client-Side** mimarisiyle tarayıcıda işlenmesine; DOCX, XLSX ve ağır PDF dosyalarının ise sunucu gücü gerektirdiği için bir **C# Windows Service (Backend)** mimarisine yönlendirilmesine (Hibrit Mimari) karar verilmiştir.
