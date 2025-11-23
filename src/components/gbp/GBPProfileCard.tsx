import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, MessageSquare, Image as ImageIcon, Eye, TrendingUp, Sparkles, FileText, Search, AlertCircle } from "lucide-react";
import { useGBPProfileStats } from "@/hooks/useGBPProfileStats";
import { Skeleton } from "@/components/ui/skeleton";

interface GBPProfileCardProps {
  profile: any;
  onClick: () => void;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );
};

export const GBPProfileCard = ({ profile, onClick }: GBPProfileCardProps) => {
  const { data: stats, isLoading: statsLoading } = useGBPProfileStats(profile.id);

  const responseRate = stats?.totalReviews > 0 
    ? Math.round((stats.respondedReviews / stats.totalReviews) * 100) 
    : 0;
  
  const unreadCount = (stats?.totalReviews || 0) - (stats?.respondedReviews || 0);

  return (
    <Card 
      className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {profile.is_mock && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Demo
                </Badge>
              )}
              <Badge variant={profile.is_active ? "default" : "outline"} className="text-xs">
                {profile.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {profile.business_name || profile.connection_name}
            </h3>
          </div>
        </div>

        {/* Reviews Section - Destaque Principal */}
        {statsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : stats && stats.totalReviews > 0 ? (
          <div className="space-y-2 p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-100 dark:border-yellow-900/30">
            {/* Rating com estrelas */}
            <div className="flex items-center gap-2">
              <StarRating rating={stats.averageRating || 0} />
              <span className="font-bold text-xl text-foreground">
                {(stats.averageRating || 0).toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            
            {/* Taxa de Resposta e Pendentes */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Resposta:</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    responseRate >= 80 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                      : responseRate >= 50
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {responseRate}%
                </Badge>
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {unreadCount} {unreadCount === 1 ? 'pendente' : 'pendentes'}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
            <p className="text-sm text-muted-foreground text-center">📝 Sem reviews ainda</p>
          </div>
        )}

        {profile.business_address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{profile.business_address}</span>
          </div>
        )}

        {profile.business_categories && profile.business_categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.business_categories.slice(0, 3).map((category: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {category}
              </Badge>
            ))}
            {profile.business_categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{profile.business_categories.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!statsLoading && stats ? (
          <div className="grid grid-cols-2 gap-2">
            {/* Posts */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
              <FileText className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-semibold">{stats.totalPosts}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
            </div>

            {/* Fotos */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
              <ImageIcon className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-semibold">{stats.totalPhotos}</p>
                <p className="text-xs text-muted-foreground">Fotos</p>
              </div>
            </div>

            {/* Views */}
            {stats.profileViews > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <Eye className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm font-semibold">
                    {stats.profileViews >= 1000 
                      ? `${(stats.profileViews / 1000).toFixed(1)}k` 
                      : stats.profileViews.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
              </div>
            )}

            {/* Buscas */}
            {stats.profileSearches > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <Search className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm font-semibold">
                    {stats.profileSearches >= 1000 
                      ? `${(stats.profileSearches / 1000).toFixed(1)}k` 
                      : stats.profileSearches.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Buscas</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        )}

        <Button 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
          variant="outline" 
          size="sm"
        >
          Ver Detalhes →
        </Button>
      </CardContent>
    </Card>
  );
};
