import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useMapboxUsage } from '@/hooks/useMapboxUsage';
import { MapboxLimitReached } from './MapboxLimitReached';

interface CityData {
  city: string;
  region: string;
  country: string;
  country_code: string;
  conversions: number;
  percentage: number;
}

interface InteractiveGeolocationMapProps {
  cities: CityData[];
  totalConversions: number;
}

// Simplified city coordinates database for common Brazilian cities
const CITY_COORDS: Record<string, [number, number]> = {
  'São Paulo': [-23.5505, -46.6333],
  'Rio de Janeiro': [-22.9068, -43.1729],
  'Brasília': [-15.8267, -47.9218],
  'Salvador': [-12.9714, -38.5014],
  'Fortaleza': [-3.7172, -38.5433],
  'Belo Horizonte': [-19.9167, -43.9345],
  'Manaus': [-3.1190, -60.0217],
  'Curitiba': [-25.4284, -49.2733],
  'Recife': [-8.0476, -34.8770],
  'Porto Alegre': [-30.0346, -51.2177],
  'Belém': [-1.4554, -48.5039],
  'Goiânia': [-16.6869, -49.2648],
  'Guarulhos': [-23.4538, -46.5333],
  'Campinas': [-22.9099, -47.0626],
  'São Luís': [-2.5297, -44.3028],
  'Maceió': [-9.6658, -35.7353],
  'Natal': [-5.7945, -35.2110],
  'Teresina': [-5.0892, -42.8019],
  'João Pessoa': [-7.1195, -34.8450],
  'Florianópolis': [-27.5954, -48.5480],
};

export const InteractiveGeolocationMap = ({ cities, totalConversions }: InteractiveGeolocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Check Mapbox usage limit
  const { data: usageData, isLoading: isCheckingUsage, error: usageError } = useMapboxUsage();

  // Debug logs
  console.log('🗺️ Mapbox Debug:', {
    tokenExists: !!mapboxToken,
    tokenValue: mapboxToken?.substring(0, 30) + '...',
    usageData,
    usageError,
    canLoad: usageData?.canLoad,
    citiesCount: cities.length,
    isCheckingUsage
  });

  useEffect(() => {
    // Check for Mapbox token
    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!token) {
      setError('Token do Mapbox não configurado. Configure VITE_MAPBOX_PUBLIC_TOKEN para visualizar o mapa.');
      return;
    }
    setMapboxToken(token);
    mapboxgl.accessToken = token;
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    try {
      // Initialize map centered on Brazil
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-47.9292, -15.7801], // Brazil center
        zoom: 3.5,
        attributionControl: false,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

      map.current.on('load', () => {
        if (!map.current) return;

        // Add markers for cities with known coordinates
        cities.forEach((city) => {
          const coords = CITY_COORDS[city.city];
          if (!coords) return;

          const [lat, lng] = coords;

          // Calculate marker size based on conversions (min 20, max 60)
          const baseSize = 20;
          const maxSize = 60;
          const size = Math.min(
            maxSize,
            baseSize + (city.conversions / totalConversions) * 200
          );

          // Create marker element
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.borderRadius = '50%';
          el.style.cursor = 'pointer';
          
          // Color gradient based on conversions
          const intensity = Math.min(1, city.conversions / (totalConversions * 0.1));
          el.style.backgroundColor = `rgba(37, 99, 235, ${0.3 + intensity * 0.7})`;
          el.style.border = '2px solid rgba(37, 99, 235, 0.8)';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          el.style.transition = 'all 0.3s ease';

          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.2)';
            el.style.zIndex = '10';
          });

          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
            el.style.zIndex = '1';
          });

          // Create popup
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
          }).setHTML(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${city.city}</h3>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                ${city.region ? `${city.region}, ` : ''}${city.country}
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #666;">Conversões:</span>
                  <span style="font-weight: 600;">${city.conversions}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #666;">Percentual:</span>
                  <span style="font-weight: 600; color: #2563eb;">${city.percentage.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          `);

          // Add marker to map
          new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);
        });
      });

    } catch (err) {
      console.error('Error initializing Mapbox:', err);
      setError('Erro ao inicializar o mapa. Verifique o token do Mapbox.');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [cities, totalConversions, mapboxToken]);

  // Show loading state while checking usage
  if (isCheckingUsage) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[500px] lg:h-[600px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Verificando limite de uso...</p>
          </div>
        </div>
      </Card>
    );
  }

  // Only block if we successfully checked usage AND limit is reached
  // If there's an error checking usage, allow map to load (fallback)
  if (usageData && !usageData.canLoad && !usageError) {
    return (
      <MapboxLimitReached 
        currentCount={usageData.currentCount}
        limit={usageData.limit}
        resetDate={usageData.resetDate}
      />
    );
  }

  // Log warning if there was an error checking usage, but continue
  if (usageError) {
    console.warn('⚠️ Erro ao verificar quota do Mapbox, permitindo carregamento:', usageError);
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 p-8 bg-muted rounded-lg text-center text-muted-foreground">
          <p>Para configurar o Mapbox:</p>
          <ol className="text-left mt-2 space-y-1 max-w-md mx-auto">
            <li>1. Crie uma conta em <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a></li>
            <li>2. Gere um token público no dashboard</li>
            <li>3. Configure a variável VITE_MAPBOX_PUBLIC_TOKEN</li>
          </ol>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div ref={mapContainer} className="w-full h-[500px] lg:h-[600px]" />
    </Card>
  );
};
