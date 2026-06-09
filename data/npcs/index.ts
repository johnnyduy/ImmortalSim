import { NpcDefinition } from '../../types';
import thienKieuTraXanh from './thien_kieu_tra_xanh.json';
import hongNhanMaDao from './hong_nhan_ma_dao.json';
import keSinhTon from './ke_sinh_ton.json';
import thienKieuChanChinh from './thien_kieu_chan_chinh.json';
import thieuGia from './thieu_gia.json';

export const npcs: NpcDefinition[] = [
  thienKieuTraXanh as NpcDefinition,
  hongNhanMaDao as NpcDefinition,
  keSinhTon as NpcDefinition,
  thienKieuChanChinh as NpcDefinition,
  thieuGia as NpcDefinition
];

export const getNpcById = (id: string): NpcDefinition | undefined => {
  return npcs.find(npc => npc.id === id);
};
