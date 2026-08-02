import { StampStyle } from "@/components/StampPreview";

export interface Stamp {
  id: string;
  imageUrl: string;
  style: StampStyle;
  metadata: {
    title: string;
    location: string;
    date: string;
    camera?: string;
  };
  albumId?: string;
  likes: parseInt;
}

export const MOCK_STAMPS: Stamp[] = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?q=80&w=600&auto=format&fit=crop",
    style: "vintage",
    metadata: {
      title: "Hà Nội Mùa Thu",
      location: "Hà Nội, VN",
      date: "12/10/2023",
      camera: "Fujifilm X-T4"
    },
    likes: 124
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=600&auto=format&fit=crop",
    style: "modern",
    metadata: {
      title: "Hồ Than Thở",
      location: "Đà Lạt, VN",
      date: "05/01/2024"
    },
    likes: 56
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1542931287-023b922fa89b?q=80&w=600&auto=format&fit=crop",
    style: "polaroid",
    metadata: {
      title: "Chuyến đi Tokyo",
      location: "Tokyo, Nhật Bản",
      date: "14/04/2025"
    },
    albumId: "album1",
    likes: 342
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format&fit=crop",
    style: "minimal",
    metadata: {
      title: "Hồ Gươm",
      location: "Hà Nội",
      date: "02/09/2022"
    },
    likes: 89
  },
  {
    id: "5",
    imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600&auto=format&fit=crop",
    style: "vintage",
    metadata: {
      title: "Góc Phố",
      location: "Hội An, VN",
      date: "22/11/2023"
    },
    likes: 210
  }
];

export const MOCK_ALBUMS = [
  { id: "album1", title: "Nhật Bản 2025", count: 12 },
  { id: "album2", title: "Đà Lạt Mộng Mơ", count: 8 },
  { id: "album3", title: "Ẩm Thực", count: 24 },
];
