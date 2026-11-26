(function (global) {
  'use strict';

  var OFFICIAL_DATA = {
    projectName: 'Undangan Pernikahan — Saepudin Hidayatullah & Khodijah',
    groom: {
      fullName: 'Saepudin Hidayatullah',
      nickname: 'Udin',
      arabicName: 'سيف الدين هداية الله',
      parents: 'Putra dari Bapak Alm. Tatang Sholihin dan Ibu Siti Jaujah.'
    },
    bride: {
      fullName: 'Khodijah',
      nickname: 'Dijah',
      arabicName: 'خديجة',
      parents: 'Putri dari Bapak Muhammad Junaedi dan Ibu Imas Rohibah.'
    },
    dateLabel: 'Kamis, 31 Desember 2026',
    copyrightText: '© 2026 Saepudin Hidayatullah & Khodijah',
    opening: {
      salam: "Assalamu'alaikum Warahmatullahi Wabarakatuh.",
      paragraph1: 'Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud menyelenggarakan acara pernikahan putra-putri kami.',
      paragraph2: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.'
    },
    events: {
      resepsi: {
        title: 'Resepsi Pernikahan',
        dayDate: 'Kamis, 31 Desember 2026',
        time: '08.00 WIB – selesai',
        venue: 'Kediaman Mempelai Wanita',
        address: 'Kp. Ninggar RT 01 RW 12, Desa Katapang, Kecamatan Katapang, Kabupaten Bandung.',
        isoStart: '2026-12-31T08:00:00+07:00'
      },
      tablig: {
        title: 'Tablig Akbar Mujarab',
        subtitle: 'Muludan Rajaban',
        dayDate: 'Kamis, 31 Desember 2026',
        time: '19.00 WIB – selesai',
        venue: 'Kp. Ninggar RT 01 RW 12, Desa Katapang, Kecamatan Katapang, Kabupaten Bandung.',
        address: 'Kp. Ninggar RT 01 RW 12, Desa Katapang, Kecamatan Katapang, Kabupaten Bandung.',
        isoStart: '2026-12-31T19:00:00+07:00'
      }
    },
    location: {
      address: 'Kp. Ninggar RT 01 RW 12, Desa Katapang, Kecamatan Katapang, Kabupaten Bandung.',
      mapsUrl: 'https://maps.app.goo.gl/opps7tLHJCER1qWw9'
    },
    gift: {
      title: 'Tanda Kasih',
      method: 'DANA',
      accountNumber: '+62 895-2451-8794',
      accountName: 'Khodijah',
      note: 'Bagi keluarga, kerabat, dan sahabat yang berkenan menyampaikan tanda kasih, dapat melalui informasi berikut. Kehadiran serta doa restu merupakan kebahagiaan yang paling berarti bagi kami.',
      voluntaryNote: 'Pemberian tanda kasih bersifat sukarela.',
      extraAccounts: []
    },
    kalamHikmah: {
      paragraphs: [
        'Rumah tangga bukanlah sekadar pertemuan dua insan dalam satu ikatan, melainkan perjalanan dua jiwa untuk saling menyempurnakan dalam ketaatan.',
        'Cinta bukan hanya tentang menemukan seseorang yang selalu sejalan, tetapi tentang kesediaan untuk tetap bergandengan tangan ketika jalan kehidupan tidak selalu mudah.',
        'Sebab pernikahan yang indah bukanlah yang tanpa ujian, melainkan yang senantiasa menjadikan Allah sebagai tujuan dan keridhaan-Nya sebagai pedoman.'
      ],
      closing: 'Berlayarlah bersama dalam bahtera kasih, berlabuhlah pada kesabaran, dan jadikan takwa sebagai kompas perjalanan.'
    },
    closing: {
      paragraphs: [
        'Tiada yang lebih kami harapkan selain doa dan restu dari keluarga, kerabat, serta sahabat sekalian.',
        'Semoga setiap langkah menuju hari bahagia ini senantiasa berada dalam limpahan rahmat dan keberkahan Allah SWT.',
        'Atas kehadiran, doa, dan perhatian yang diberikan, kami mengucapkan terima kasih.'
      ],
      salam: "Wassalamu'alaikum Warahmatullahi Wabarakatuh.",
      family: 'Saepudin Hidayatullah & Khodijah.'
    },
    theme: {
      ivory: '#F8F4EA',
      cream: '#E9DFC9',
      gold: '#C6A66B',
      taupe: '#85765F',
      charcoal: '#38352F'
    },
    music: {
      enabled: true,
      volume: 0.55,
      title: 'Instrumen Klasik Ivory',
      audioDataUrl: ''
    },
    autoplay: {
      enabled: true,
      intervalMs: 3800
    },
    animation: {
      mode: 'stpageflip',
      flipTimeMs: 750,
      shadowOpacity: 0.45
    },
    pageVisibility: {
      1: true, 2: true, 3: true, 4: true, 5: true,
      6: true, 7: true, 8: true, 9: true, 10: true
    },
    pageOrder: ['2', '3', '4', '5', '6', '7', '8', '9', '10'],
    customPages: [],
    media: {
      groomPhoto: '',
      bridePhoto: '',
      gallery: []
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OFFICIAL_DATA;
  } else {
    global.OFFICIAL_INVITATION_DATA = OFFICIAL_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
