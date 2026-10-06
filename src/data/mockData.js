

export const PAYMENT_METHODS = [
  {
    category: "Bank Transfer",
    options: [
      {
        id: "bri",
        name: "Bank BRI",
        icon: "bank",
        logoUrl: "/payments/bri.svg",
        color: "#00529C",
        accountNo: "0021-01-082377-50-2",
        accountName: "Yayasan Perjuangan Wahidiyah"
      },
      {
        id: "seabank",
        name: "SeaBank",
        icon: "bank",
        logoUrl: "/payments/seabank.svg",
        color: "#F15A24",
        accountNo: "9012-8823-7746-4017",
        accountName: "Yayasan Perjuangan Wahidiyah"
      },
      {
        id: "bca",
        name: "Bank BCA",
        icon: "bank",
        logoUrl: "/payments/bca.svg",
        color: "#003688",
        accountNo: "822-019-2811",
        accountName: "Yayasan Perjuangan Wahidiyah"
      }
    ]
  },
  {
    category: "E-Wallet & QRIS",
    options: [
      {
        id: "qris",
        name: "QRIS Midtrans",
        icon: "wallet",
        logoUrl: "/payments/qris.svg",
        color: "#EA2127",

      },
      {
        id: "gopay",
        name: "GoPay",
        icon: "wallet",
        logoUrl: "/payments/gopay.svg",
        color: "#00AED6",

      },
      {
        id: "dana",
        name: "DANA",
        icon: "wallet",
        logoUrl: "/payments/dana.svg",
        color: "#118EEA",

      },
      {
        id: "ovo",
        name: "OVO",
        icon: "wallet",
        logoUrl: "/payments/ovo.svg",
        color: "#4C3494",

      }
    ]
  }
];

export const FAQ_ITEMS = [
  {
    id: 1,
    question: "Bagaimana cara mengubah informasi profil saya?",
    answer: "Untuk mengubah informasi profil Anda, silakan buka menu Profile > Profile Saya. Di halaman tersebut Anda dapat memperbarui foto profil, nama lengkap, email, dan tanggal lahir. Klik tombol 'Save changes' berwarna hijau untuk menyimpan pembaruan."
  },
  {
    id: 2,
    question: "Bagaimana cara melihat riwayat langganan saya?",
    answer: "Anda dapat melihat daftar paket langganan aktif maupun riwayat paket terdahulu dengan masuk ke menu Profile > Riwayat Langganan. Di sana tertera status langganan (Aktif / Berakhir) beserta jangka waktu periodenya."
  },
  {
    id: 3,
    question: "Apa saja fitur utama aplikasi ini?",
    answer: "Aplikasi Buku Wahidiyah menyediakan katalog lengkap literatur dan ajaran Sholawat Wahidiyah, pembaca PDF interaktif dengan navigasi halaman, zoom kontrol, mode layar penuh (mobile & desktop), bookmark, rotasi, mode tema, serta akses offline untuk pengguna berlangganan Pro."
  },
  {
    id: 4,
    question: "Bagaimana cara menghubungi dukungan teknis?",
    answer: "Jika Anda mengalami kendala pada akun atau transaksi langganan, Anda dapat menghubungi tim kami melalui email support@bukuku.id atau WhatsApp Layanan Bantuan resmi. Tim kami siap membantu pada hari kerja pukul 08.00 - 17.00 WIB."
  }
];

