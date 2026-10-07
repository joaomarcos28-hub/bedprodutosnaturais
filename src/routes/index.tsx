import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "";
import {
  Tv,
  Search,
  Radio,
  Maximize,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  Play,
  Info,
  Sparkles,
  Globe,
  ListFilter,
  Tv2,
  Flame,
  Clock,
  ShieldAlert,
  RefreshCw
}
from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: TvAbertaApp,
});

interface Channel {
  id: string;
  name: string;
  category: "aberta" | "noticias" | "esportes" | "cultura" | "religioso" | "infantil" | "regional";
  logo: string;
  streamUrl: string;
  description: string;
  currentProgram: string;
  nextProgram: string;
  badge?: string;
  quality: string;
}

const CHANNELS: Channel[] = [
  {
    id: "globo",
    name: "Rede Globo",
    category: "aberta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Rede_Globo_logo_2021.svg/1200px-Rede_Globo_logo_2021.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // stream demonstrativo seguro
    description: "A maior rede de televisão do Brasil, com novelas, jornalismo e entretenimento.",
    currentProgram: "Jornal Nacional",
    nextProgram: "Travessia / Novela das 21h",
    badge: "HD • Ao Vivo",
    quality: "1080p"
  },
  {
    id: "sbt",
    name: "SBT",
    category: "aberta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/SBT_logo_2023.svg/1200px-SBT_logo_2023.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "Sistema Brasileiro de Televisão. Alegria e diversão para toda a família.",
    currentProgram: "Programa do Ratinho",
    nextProgram: "The Noite com Danilo Gentili",
    badge: "HD • Ao Vivo",
    quality: "1080p"
  },
  {
    id: "record",
    name: "Record TV",
    category: "aberta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Record_TV_logo_2022.svg/1200px-Record_TV_logo_2022.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "Jornalismo de verdade, grandes produções e realities shows.",
    currentProgram: "Jornal da Record",
    nextProgram: "A Fazenda / Série Exclusiva",
    badge: "HD • Ao Vivo",
    quality: "1080p"
  },
  {
    id: "band",
    name: "Band",
    category: "aberta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Logo_Band_2018.svg/1200px-Logo_Band_2018.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "O canal do esporte, jornalismo forte e grandes debates.",
    currentProgram: "Brasil Urgente",
    nextProgram: "Jornal da Band",
    badge: "Esporte • Ao Vivo",
    quality: "1080p"
  },
  {
    id: "redetv",
    name: "RedeTV!",
    category: "aberta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/RedeTV%21_logo_2019.svg/1200px-RedeTV%21_logo_2019.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "Entretenimento, fofocas, humor e cobertura esportiva.",
    currentProgram: "A Tarde é Sua",
    nextProgram: "TV Fama",
    badge: "Ao Vivo",
    quality: "720p"
  },
  {
    id: "cultura",
    name: "TV Cultura",
    category: "cultura",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/TV_Cultura_logo_2024.svg/1200px-TV_Cultura_logo_2024.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "Educação, cultura, música de qualidade e programação infantil inteligente.",
    currentProgram: "Roda Viva",
    nextProgram: "Jornal da Cultura",
    badge: "Cultura • HD",
    quality: "1080p"
  },
  {
    id: "cnn",
    name: "CNN Brasil",
    category: "noticias",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/CNN_Brasil_logo.svg/1200px-CNN_Brasil_logo.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "Notícias 24 horas por dia, cobertura nacional e internacional em tempo real.",
    currentProgram: "CNN Prime Time",
    nextProgram: "Jornal da CNN",
    badge: "24h • Notícias",
    quality: "1080p"
  },
  {
    id: "globonews",
    name: "GloboNews",
    category: "noticias",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/GloboNews_logo_2022.svg/1200px-GloboNews_logo_2022.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "O canal de notícias que está no centro dos fatos.",
    currentProgram: "Em Pauta",
    nextProgram: "Jornal das Dez",
    badge: "Assinantes • Ao Vivo",
    quality: "1080p"
  },
  {
    id: "espn",
    name: "ESPN Brasil",
    category: "esportes",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "Futebol nacional e internacional, NFL, NBA e os maiores eventos esportivos.",
    currentProgram: "SportsCenter",
    nextProgram: "Futebol ao Vivo",
    badge: "Esporte Total",
    quality: "1080p"
  },
  {
    id: "tvbrasil",
    name: "TV Brasil",
    category: "aberta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/TV_Brasil_logo_2023.svg/1200px-TV_Brasil_logo_2023.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "A emissora pública federal com diversidade cultural e cívica do país.",
    currentProgram: "Repórter Brasil",
    nextProgram: "Cine Nacional",
    badge: "Pública • HD",
    quality: "1080p"
  },
  {
    id: "gazeta",
    name: "TV Gazeta",
    category: "aberta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/TV_Gazeta_logo_2020.svg/1200px-TV_Gazeta_logo_2020.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "Tradição em São Paulo com programas femininos, esporte e jornalismo.",
    currentProgram: "Mulheres",
    nextProgram: "Mesa Redonda",
    badge: "Tradicional",
    quality: "720p"
  },
  {
    id: "redebrasil",
    name: "Rede Brasil (RBTV)",
    category: "aberta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Rede_Brasil_logo_2021.svg/1200px-Rede_Brasil_logo_2021.svg.png",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "Séries clássicas, animes, filmes e muito entretenimento retrô.",
    currentProgram: "Sessão Retrô",
    nextProgram: "Anime Action",
    badge: "Retro • Séries",
    quality: "720p"
  }
];

export default function TvAbertaApp() {
  const [selectedChannel, setSelectedChannel] = useState<Channel>(CHANNELS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorite, setIsFavorite] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);

  const filteredChannels = useMemo(() => {
    return CHANNELS.filter((ch) => {
      const matchesSearch =
        ch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ch.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        activeCategory === "todos" ||
        (activeCategory === "favoritos" && isFavorite.includes(ch.id)) ||
        ch.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory, isFavorite]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite.includes(id)) {
      setIsFavorite(isFavorite.filter((fav) => fav !== id));
      toast.info("Canal removido dos favoritos");
    } else {
      setIsFavorite([...isFavorite, id]);
      toast.success("Canal adicionado aos favoritos!");
    }
  };

  const shareChannel = (ch: Channel) => {
    if (navigator.share) {
      navigator.share({
        title: `Assistir ${ch.name} ao vivo`,
        text: `Assista ${ch.name} (${ch.currentProgram}) de graça no TV Aberta Brasil!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-red-600 to-amber-500 p-2 rounded-xl text-white shadow-lg shadow-red-600/20">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg lg:text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                TV Aberta Brasil
              </h1>
              <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-950/30 text-xs">
                AO VIVO
              </Badge>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Todos os principais canais abertos do Brasil em HD no seu navegador
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar canal ou programa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 rounded-full focus-visible:ring-red-500"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 gap-2"
            onClick={() => {
              toast.success("Conexão otimizada com servidores CDN!");
            }}
          >
            <RefreshCw className="h-4 w-4 text-red-400" />
            <span className="hidden sm:inline">Atualizar Sinal</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column: Video Player & Info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Video Player Box */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
            {isPlaying ? (
              <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                {/* Simulador de Player de Vídeo com o stream escolhido */}
                <video
                  key={selectedChannel.id}
                  className="w-full h-full object-contain bg-black"
                  autoPlay
                  playsInline
                  muted={isMuted}
                  loop
                  poster={selectedChannel.logo}
                  src={selectedChannel.streamUrl}
                />
                
                {/* Overlay Controls On Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600 text-white font-semibold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        AO VIVO
                      </Badge>
                      <span className="text-xs bg-black/60 px-2 py-1 rounded text-slate-300">
                        {selectedChannel.quality}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/20 rounded-full"
                        onClick={(e) => toggleFavorite(selectedChannel.id, e)}
                      >
                        <Heart
                          className={`h-5 w-5 ${isFavorite.includes(selectedChannel.id) ? "fill-red-500 text-red-500" : "text-white"}`}
                        />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/20 rounded-full"
                        onClick={() => shareChannel(selectedChannel)}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-xl font-bold text-white drop-shadow">{selectedChannel.name}</h2>
                      <p className="text-sm text-slate-300 drop-shadow">Exibindo agora: {selectedChannel.currentProgram}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/20 rounded-full"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/20 rounded-full"
                        onClick={() => {
                          const elem = document.querySelector("video");
                          if (elem?.requestFullscreen) elem.requestFullscreen();
                        }}
                      >
                        <Maximize className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-3">
                <Tv className="h-16 w-16 text-slate-600 animate-pulse" />
                <p className="text-slate-400">Canal pausado</p>
                <Button onClick={() => setIsPlaying(true)} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Play className="h-4 w-4 fill-white" /> Retomar Transmissão
                </Button>
              </div>
            )}
          </div>

          {/* Channel Details Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 backdrop-blur">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-24 bg-white/5 border border-slate-800 rounded-xl flex items-center justify-center p-2">
                  <img
                    src={selectedChannel.logo}
                    alt={selectedChannel.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedChannel.name}</h2>
                    <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                      {selectedChannel.badge || "HD"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{selectedChannel.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant={isFavorite.includes(selectedChannel.id) ? "default" : "outline"}
                  className={`flex-1 sm:flex-none gap-2 ${isFavorite.includes(selectedChannel.id) ? "bg-red-600 hover:bg-red-700 text-white" : "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200"}`}
                  onClick={(e) => toggleFavorite(selectedChannel.id, e)}
                >
                  <Heart className={`h-4 w-4 ${isFavorite.includes(selectedChannel.id) ? "fill-white" : ""}`}
                  />
                  {isFavorite.includes(selectedChannel.id) ? "Favorito" : "Favoritar"}
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200"
                  onClick={() => shareChannel(selectedChannel)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                <div className="p-2 bg-red-600/10 text-red-400 rounded-lg">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">No Ar Agora</span>
                  <span className="text-sm font-semibold text-white">{selectedChannel.currentProgram}</span>
                </div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">A seguir</span>
                  <span className="text-sm font-semibold text-slate-300">{selectedChannel.nextProgram}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Channel Selector / Playlist */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Tv2 className="h-5 w-5 text-red-500" /> Canais Disponíveis
            </h3>
            <span className="text-xs text-slate-400">({filteredChannels.length} canais)</span>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: "todos", label: "Todos" },
              { id: "favoritos", label: "❤️ Favoritos" },
              { id: "aberta", label: "Aberta" },
              { id: "noticias", label: "Notícias" },
              { id: "esportes", label: "Esportes" },
              { id: "cultura", label: "Cultura" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Mobile Search bar */}
          <div className="relative md:hidden">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar canal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 text-sm text-slate-200"
            />
          </div>

          {/* Channel List */}
          <div className="flex flex-col gap-2.5 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
                <ShieldAlert className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-300 font-medium">Nenhum canal encontrado</p>
                <p className="text-xs text-slate-500 mt-1">Tente buscar por outro termo ou categoria.</p>
              </div>
            ) : (
              filteredChannels.map((ch) => {
                const isSelected = selectedChannel.id === ch.id;
                const fav = isFavorite.includes(ch.id);

                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      setSelectedChannel(ch);
                      setIsPlaying(true);
                    }}
                    className={`group relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-red-950/40 to-slate-900 border-red-600/60 shadow-lg shadow-red-950/30"
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-16 bg-black/40 rounded-lg flex items-center justify-center p-1.5 border border-slate-800">
                        <img src={ch.logo} alt={ch.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
                            {ch.name}
                          </h4>
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{ch.currentProgram}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => toggleFavorite(ch.id, e)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Heart className={`h-4 w-4 ${fav ? "fill-red-500 text-red-500" : "text-slate-500"}`}
                        />
                      </button>
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-red-600 text-white" : "text-slate-400"}`}>
                        <Play className={`h-3.5 w-3.5 ${isSelected ? "fill-white" : ""}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} TV Aberta Brasil. Todos os direitos reservados. Transmissões oficiais abertas.</p>
      </footer>
    </div>
  );
}
