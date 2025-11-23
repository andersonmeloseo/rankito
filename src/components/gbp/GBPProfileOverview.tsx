import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, Mail, Globe, Clock, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GBPProfileOverviewProps {
  profile: any;
}

export const GBPProfileOverview = ({ profile }: GBPProfileOverviewProps) => {
  const businessHours = profile.business_hours || {};
  const attributes = profile.attributes || {};

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Avatar className="h-24 w-24 rounded-lg">
            <AvatarImage src={profile.profile_photo_url} alt={profile.business_name} />
            <AvatarFallback className="rounded-lg text-2xl">
              {profile.business_name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-2xl font-bold">{profile.business_name}</h1>
              {profile.verification_status === 'verified' && (
                <Badge variant="default" className="w-fit">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verificado
                </Badge>
              )}
              {profile.is_mock && (
                <Badge variant="secondary" className="w-fit">
                  Demo
                </Badge>
              )}
            </div>

            {profile.average_rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-semibold">{profile.average_rating.toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground">
                  ({profile.total_reviews} avaliações)
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {profile.business_categories?.map((category: string, idx: number) => (
                <Badge key={idx} variant="outline">{category}</Badge>
              ))}
            </div>

            {profile.business_description && (
              <p className="text-muted-foreground">{profile.business_description}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Informações de Contato</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {profile.business_address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Endereço</p>
                <p className="text-sm text-muted-foreground">{profile.business_address}</p>
              </div>
            </div>
          )}

          {profile.business_phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-sm text-muted-foreground">{profile.business_phone}</p>
              </div>
            </div>
          )}

          {profile.business_email && (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile.business_email}</p>
              </div>
            </div>
          )}

          {profile.business_website && (
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Website</p>
                <a 
                  href={profile.business_website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {profile.business_website}
                </a>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Business Hours */}
      {Object.keys(businessHours).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários de Funcionamento
          </h2>
          <div className="space-y-2">
            {Object.entries(businessHours).map(([day, hours]: [string, any]) => (
              <div key={day} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="font-medium capitalize">
                  {day === 'monday' && 'Segunda'}
                  {day === 'tuesday' && 'Terça'}
                  {day === 'wednesday' && 'Quarta'}
                  {day === 'thursday' && 'Quinta'}
                  {day === 'friday' && 'Sexta'}
                  {day === 'saturday' && 'Sábado'}
                  {day === 'sunday' && 'Domingo'}
                </span>
                <span className="text-muted-foreground">
                  {hours.closed ? 'Fechado' : `${hours.open} - ${hours.close}`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Attributes */}
      {Object.keys(attributes).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Facilidades</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(attributes).map(([key, value]: [string, any]) => (
              value && (
                <div key={key} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </div>
              )
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
