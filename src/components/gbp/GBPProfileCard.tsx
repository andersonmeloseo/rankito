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

const StarRating = ({ rating, size = "default" }: { rating: number; size?: "default" | "large" }) => {
  const sizeClasses = size === "large" ? "w-6 h-6" : "w-4 h-4";
  const glowEffect = size === "large" ? "drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" : "";
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses} ${glowEffect} ${
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

        {/* Premium Review Hero Section */}
        {statsLoading ? (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-orange-950/20 border-2 border-amber-200/60 dark:border-amber-800/30 p-5 shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            <div className="relative space-y-3">
              <div className="flex justify-center">
                <Skeleton className="h-6 w-40" />
              </div>
              <div className="text-center">
                <Skeleton className="h-14 w-24 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-5 w-48 mx-auto" />
              </div>
            </div>
          </div>
        ) : stats && stats.totalReviews > 0 ? (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-orange-950/20 border-2 border-amber-200/60 dark:border-amber-800/30 p-5 shadow-inner transition-all duration-300 hover:scale-[1.02]">
            {/* Decorative glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            
            <div className="relative space-y-3">
              {/* Large Stars */}
              <div className="flex justify-center">
                <StarRating rating={stats.averageRating || 0} size="large" />
              </div>
              
              {/* Giant Rating with Golden Gradient */}
              <div className="text-center">
                <span className="text-5xl font-black bg-gradient-to-br from-amber-600 via-yellow-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm tracking-tight">
                  {(stats.averageRating || 0).toFixed(1)}
                </span>
              </div>
              
              {/* Secondary Info */}
              <div className="text-center text-base font-medium text-muted-foreground">
                {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}
                {" • "}
                <span className="font-semibold">
                  {responseRate}% respondidos
                </span>
              </div>
              
              {/* Action Badges - Horizontal */}
              <div className="flex gap-2 justify-center flex-wrap">
                {stats.respondedReviews > 0 && (
                  <Badge 
                    variant="success" 
                    className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                  >
                    ✓ {stats.respondedReviews} respondidas
                  </Badge>
                )}
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="text-xs bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 animate-pulse"
                  >
                    ⚠ {unreadCount} pendentes
                  </Badge>
                )}
              </div>
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
