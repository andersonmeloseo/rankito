import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CountryData {
  country: string;
  country_code: string;
  conversions: number;
  percentage: number;
}

interface CityData {
  city: string;
  region: string;
  country: string;
  country_code: string;
  conversions: number;
  percentage: number;
}

interface RegionData {
  region: string;
  country: string;
  conversions: number;
  percentage: number;
}

interface GeoRankingTablesProps {
  countries: CountryData[];
  cities: CityData[];
  regions: RegionData[];
}

const getCountryFlag = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const GeoRankingTables = ({ countries, cities, regions }: GeoRankingTablesProps) => {
  const [countrySort, setCountrySort] = useState<'asc' | 'desc'>('desc');
  const [citySort, setCitySort] = useState<'asc' | 'desc'>('desc');
  const [regionSort, setRegionSort] = useState<'asc' | 'desc'>('desc');

  const sortedCountries = [...countries].sort((a, b) => 
    countrySort === 'desc' ? b.conversions - a.conversions : a.conversions - b.conversions
  ).slice(0, 10);

  const sortedCities = [...cities].sort((a, b) => 
    citySort === 'desc' ? b.conversions - a.conversions : a.conversions - b.conversions
  ).slice(0, 10);

  const sortedRegions = [...regions].sort((a, b) => 
    regionSort === 'desc' ? b.conversions - a.conversions : a.conversions - b.conversions
  ).slice(0, 10);

  const SortButton = ({ sort, onToggle }: { sort: 'asc' | 'desc'; onToggle: () => void }) => (
    <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
      {sort === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
    </Button>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Top 10 Países
            <SortButton sort={countrySort} onToggle={() => setCountrySort(s => s === 'desc' ? 'asc' : 'desc')} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>País</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCountries.map((country, index) => (
                <TableRow key={country.country_code}>
                  <TableCell>
                    <Badge variant="outline">{index + 1}</Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <span className="text-2xl">{getCountryFlag(country.country_code)}</span>
                    <span>{country.country}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium">{country.conversions}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {country.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Top 10 Cidades
            <SortButton sort={citySort} onToggle={() => setCitySort(s => s === 'desc' ? 'asc' : 'desc')} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>País</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCities.map((city, index) => (
                <TableRow key={`${city.city}-${city.country}`}>
                  <TableCell>
                    <Badge variant="outline">{index + 1}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{city.city}</div>
                      {city.region && (
                        <div className="text-sm text-muted-foreground">{city.region}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <span className="text-xl">{getCountryFlag(city.country_code)}</span>
                    <span className="text-sm">{city.country}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium">{city.conversions}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {city.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Top 10 Regiões/Estados
            <SortButton sort={regionSort} onToggle={() => setRegionSort(s => s === 'desc' ? 'asc' : 'desc')} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>País</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRegions.map((region, index) => (
                <TableRow key={`${region.region}-${region.country}`}>
                  <TableCell>
                    <Badge variant="outline">{index + 1}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{region.region}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{region.country}</TableCell>
                  <TableCell className="text-right font-medium">{region.conversions}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {region.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
