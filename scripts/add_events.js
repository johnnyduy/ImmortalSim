const fs = require('fs');

const viEventsToAdd = [
  {
    "id": "event_thien_kieu_tra_xanh_gap_go",
    "title": "Gặp Gỡ Mộc Uyển Thanh",
    "description": "Tại Cổ Nhân Động Phủ, bạn thấy Mộc Uyển Thanh đang bị yêu thú bao vây, dáng vẻ yếu đuối cầu cứu.",
    "minAge": 15,
    "maxAge": 50,
    "weight": 2,
    "tags": ["npc_thien_kieu_tra_xanh", "rescue"],
    "choices": [
      {
        "id": "rescue_tra_xanh",
        "text": "Ra tay cứu giúp, không thể thấy chết không cứu.",
        "effects": {
          "health": -5,
          "karma": 5,
          "npcFavorability": { "npc_thien_kieu_tra_xanh": 10 },
          "npcGrudges": { "npc_thien_kieu_tra_xanh": 0 }
        }
      },
      {
        "id": "ignore_tra_xanh",
        "text": "Nhận ra sự bất thường, lẳng lặng rời đi.",
        "effects": {
          "luck": 1,
          "npcFavorability": { "npc_thien_kieu_tra_xanh": -20 },
          "npcGrudges": { "npc_thien_kieu_tra_xanh": 10 }
        }
      }
    ]
  },
  {
    "id": "event_hong_nhan_ma_dao_am_sat",
    "title": "Huyết Mân Côi Phục Kích",
    "description": "Đang thám hiểm Vạn Thú Sơn Mạch, Huyết Mân Côi đột nhiên hiện nguyên hình tà tu, gọi đồng bọn bao vây bạn.",
    "minAge": 20,
    "maxAge": 80,
    "weight": 2,
    "tags": ["npc_hong_nhan_ma_dao", "demonic"],
    "choices": [
      {
        "id": "fight_hong_nhan",
        "text": "Quyết chiến tử thành!",
        "effects": {
          "health": -15,
          "cultivation": 10,
          "luck": 2,
          "npcFavorability": { "npc_hong_nhan_ma_dao": -50 },
          "npcGrudges": { "npc_hong_nhan_ma_dao": 50 }
        }
      },
      {
        "id": "flee_hong_nhan",
        "text": "Bỏ lại tài sản, tìm đường tẩu thoát.",
        "effects": {
          "spiritStones": -100,
          "health": -5,
          "npcFavorability": { "npc_hong_nhan_ma_dao": -10 }
        }
      }
    ]
  },
  {
    "id": "event_ke_sinh_ton_phan_boi",
    "title": "Cẩu Dư Phản Bội",
    "description": "Trong lúc Tông môn có nội loạn, Cẩu Dư lén dẫn một nhóm phản đồ đến động phủ của bạn để cướp tài nguyên.",
    "minAge": 30,
    "maxAge": 100,
    "weight": 2,
    "tags": ["npc_ke_sinh_ton", "rebel"],
    "choices": [
      {
        "id": "kill_cau_du",
        "text": "Thanh lý môn hộ, giết không tha!",
        "effects": {
          "karma": -10,
          "health": -10,
          "sectContribution": 50,
          "npcFavorability": { "npc_ke_sinh_ton": -100 },
          "npcGrudges": { "npc_ke_sinh_ton": 80 }
        }
      },
      {
        "id": "bribe_cau_du",
        "text": "Đưa cho hắn Trúc Cơ Đan để đổi lấy sự bình yên.",
        "effects": {
          "spiritStones": -500,
          "karma": 5,
          "worldState": { "sect": { "stability": -5 } }
        }
      }
    ]
  },
  {
    "id": "event_thien_kieu_chan_chinh_thach_dau",
    "title": "Chung Kết Đại Hội Tỷ Thí",
    "description": "Long Ngạo Thiên, con cưng thiên đạo, đứng trên lôi đài chờ bạn. Linh khí quanh hắn bạo động dữ dội.",
    "minAge": 18,
    "maxAge": 25,
    "weight": 2,
    "tags": ["npc_thien_kieu_chan_chinh", "tournament"],
    "choices": [
      {
        "id": "fight_ngao_thien",
        "text": "Dốc toàn lực, chứng minh ai mới là thiên kiêu!",
        "effects": {
          "health": -20,
          "cultivation": 20,
          "sectPrestige": 100,
          "worldState": { "sect": { "reputation": 10 }, "global": { "daoFluctuation": 5 } },
          "npcFavorability": { "npc_thien_kieu_chan_chinh": 20 }
        }
      },
      {
        "id": "surrender_ngao_thien",
        "text": "Biết khó lui bước, nhận thua bảo toàn tính mạng.",
        "effects": {
          "daoHeart": -5,
          "health": 0
        }
      }
    ]
  },
  {
    "id": "event_thieu_gia_gay_su",
    "title": "Vương Thiếu Gia Chèn Ép",
    "description": "Tại đấu giá hội, Vương Tư Thông dùng tiền bạc cướp bảo vật bạn đang nhắm tới và buông lời sỉ nhục.",
    "minAge": 15,
    "maxAge": 40,
    "weight": 2,
    "tags": ["npc_thieu_gia", "auction"],
    "choices": [
      {
        "id": "slap_thieu_gia",
        "text": "Đánh mặt thiếu gia, cướp lại bảo vật ở bên ngoài!",
        "effects": {
          "spiritStones": 200,
          "karma": -5,
          "health": -5,
          "npcFavorability": { "npc_thieu_gia": -80 },
          "npcGrudges": { "npc_thieu_gia": 100 }
        }
      },
      {
        "id": "endure_thieu_gia",
        "text": "Nhẫn nhịn nuốt giận, quân tử trả thù mười năm chưa muộn.",
        "effects": {
          "daoHeart": 2,
          "karma": 2
        }
      }
    ]
  }
];

const enEventsToAdd = [
  {
    "id": "event_thien_kieu_tra_xanh_gap_go",
    "title": "Encountering Moc Uyen Thanh",
    "description": "At the Ancient Cave, you see Moc Uyen Thanh surrounded by demonic beasts, looking weak and calling for help.",
    "minAge": 15,
    "maxAge": 50,
    "weight": 2,
    "tags": ["npc_thien_kieu_tra_xanh", "rescue"],
    "choices": [
      {
        "id": "rescue_tra_xanh",
        "text": "Lend a hand, cannot leave her to die.",
        "effects": {
          "health": -5,
          "karma": 5,
          "npcFavorability": { "npc_thien_kieu_tra_xanh": 10 },
          "npcGrudges": { "npc_thien_kieu_tra_xanh": 0 }
        }
      },
      {
        "id": "ignore_tra_xanh",
        "text": "Sense something is wrong and leave quietly.",
        "effects": {
          "luck": 1,
          "npcFavorability": { "npc_thien_kieu_tra_xanh": -20 },
          "npcGrudges": { "npc_thien_kieu_tra_xanh": 10 }
        }
      }
    ]
  },
  {
    "id": "event_hong_nhan_ma_dao_am_sat",
    "title": "Huyet Man Coi's Ambush",
    "description": "While exploring the Ten Thousand Beasts Mountain, Huyet Man Coi reveals her demonic nature and calls her gang to surround you.",
    "minAge": 20,
    "maxAge": 80,
    "weight": 2,
    "tags": ["npc_hong_nhan_ma_dao", "demonic"],
    "choices": [
      {
        "id": "fight_hong_nhan",
        "text": "Fight to the death!",
        "effects": {
          "health": -15,
          "cultivation": 10,
          "luck": 2,
          "npcFavorability": { "npc_hong_nhan_ma_dao": -50 },
          "npcGrudges": { "npc_hong_nhan_ma_dao": 50 }
        }
      },
      {
        "id": "flee_hong_nhan",
        "text": "Leave your belongings and escape.",
        "effects": {
          "spiritStones": -100,
          "health": -5,
          "npcFavorability": { "npc_hong_nhan_ma_dao": -10 }
        }
      }
    ]
  },
  {
    "id": "event_ke_sinh_ton_phan_boi",
    "title": "Cau Du's Betrayal",
    "description": "During a sect rebellion, Cau Du secretly leads a group of traitors to your cave to rob your resources.",
    "minAge": 30,
    "maxAge": 100,
    "weight": 2,
    "tags": ["npc_ke_sinh_ton", "rebel"],
    "choices": [
      {
        "id": "kill_cau_du",
        "text": "Cleanse the sect, kill him without mercy!",
        "effects": {
          "karma": -10,
          "health": -10,
          "sectContribution": 50,
          "npcFavorability": { "npc_ke_sinh_ton": -100 },
          "npcGrudges": { "npc_ke_sinh_ton": 80 }
        }
      },
      {
        "id": "bribe_cau_du",
        "text": "Give him a Foundation Pill to buy peace.",
        "effects": {
          "spiritStones": -500,
          "karma": 5,
          "worldState": { "sect": { "stability": -5 } }
        }
      }
    ]
  },
  {
    "id": "event_thien_kieu_chan_chinh_thach_dau",
    "title": "Tournament Finals",
    "description": "Long Ngao Thien, the child of heaven, stands on the arena waiting for you. Spiritual energy violently swirls around him.",
    "minAge": 18,
    "maxAge": 25,
    "weight": 2,
    "tags": ["npc_thien_kieu_chan_chinh", "tournament"],
    "choices": [
      {
        "id": "fight_ngao_thien",
        "text": "Go all out and prove who the real prodigy is!",
        "effects": {
          "health": -20,
          "cultivation": 20,
          "sectPrestige": 100,
          "worldState": { "sect": { "reputation": 10 }, "global": { "daoFluctuation": 5 } },
          "npcFavorability": { "npc_thien_kieu_chan_chinh": 20 }
        }
      },
      {
        "id": "surrender_ngao_thien",
        "text": "Know when to retreat, surrender to save your life.",
        "effects": {
          "daoHeart": -5,
          "health": 0
        }
      }
    ]
  },
  {
    "id": "event_thieu_gia_gay_su",
    "title": "Young Master Vuong's Oppression",
    "description": "At the auction, Vuong Tu Thong uses his wealth to snatch the treasure you wanted and insults you.",
    "minAge": 15,
    "maxAge": 40,
    "weight": 2,
    "tags": ["npc_thieu_gia", "auction"],
    "choices": [
      {
        "id": "slap_thieu_gia",
        "text": "Slap his face and rob the treasure outside!",
        "effects": {
          "spiritStones": 200,
          "karma": -5,
          "health": -5,
          "npcFavorability": { "npc_thieu_gia": -80 },
          "npcGrudges": { "npc_thieu_gia": 100 }
        }
      },
      {
        "id": "endure_thieu_gia",
        "text": "Endure the anger, a gentleman can wait ten years for revenge.",
        "effects": {
          "daoHeart": 2,
          "karma": 2
        }
      }
    ]
  }
];

function addEventsToFile(filePath, newEvents) {
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // check if already added
    if (!data.find(e => e.id === newEvents[0].id)) {
      data.push(...newEvents);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log('Added events to ' + filePath);
    } else {
      console.log('Events already in ' + filePath);
    }
  } else {
    console.log('File not found: ' + filePath);
  }
}

addEventsToFile('locales/vi/events.json', viEventsToAdd);
addEventsToFile('locales/en/events.json', enEventsToAdd);
addEventsToFile('data/events.json', enEventsToAdd);
