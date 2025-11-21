import { useMemo } from 'react';
import type { 
  EcommerceMetrics, 
  ProductPerformance, 
  PageAnalysis 
} from './useEcommerceAnalytics';

export interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'info';
  category: 'product' | 'page' | 'funnel' | 'revenue';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  data?: any;
}

export interface HealthScore {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor';
  breakdown: {
    conversionRate: number;
    cartAbandonment: number;
    revenueGrowth: number;
    productDiversity: number;
    pagePerformance: number;
  };
}

export const useEcommerceInsights = (
  metrics: EcommerceMetrics | undefined,
  previousMetrics: EcommerceMetrics | undefined,
  products: ProductPerformance[] | undefined,
  pages: PageAnalysis[] | undefined
) => {
  const insights = useMemo<Insight[]>(() => {
    if (!metrics || !products || !pages) return [];

    const detectedInsights: Insight[] = [];

    // 1. Produtos de Oportunidade (alta visualização + baixa conversão)
    const avgViews = products.reduce((sum, p) => sum + p.views, 0) / products.length || 1;
    const avgConversion = products.reduce((sum, p) => sum + p.conversionRate, 0) / products.length || 1;
    
    const opportunityProducts = products.filter(p => 
      p.views > avgViews * 1.5 && p.conversionRate < avgConversion * 0.7 && p.conversionRate > 0
    );

    if (opportunityProducts.length > 0) {
      const topOpportunity = opportunityProducts[0];
      detectedInsights.push({
        id: 'opportunity-product-1',
        type: 'opportunity',
        category: 'product',
        title: 'Produto com Grande Oportunidade',
        description: `"${topOpportunity.productName}" tem ${topOpportunity.views} visualizações mas apenas ${topOpportunity.conversionRate.toFixed(1)}% de conversão (média: ${avgConversion.toFixed(1)}%)`,
        impact: 'high',
        recommendation: 'Revise o preço, imagens, descrição ou adicione avaliações de clientes para aumentar a conversão.',
        data: { product: topOpportunity }
      });
    }

    // 2. Produtos Inativos (sem vendas mas com visualizações)
    const inactiveProducts = products.filter(p => p.purchases === 0 && p.views > 5);
    
    if (inactiveProducts.length > 0) {
      detectedInsights.push({
        id: 'inactive-products',
        type: 'warning',
        category: 'product',
        title: `${inactiveProducts.length} Produtos Sem Vendas`,
        description: `${inactiveProducts.length} produtos têm visualizações mas nenhuma venda no período`,
        impact: 'medium',
        recommendation: 'Considere criar promoções, melhorar as descrições ou revisar o posicionamento desses produtos.',
        data: { count: inactiveProducts.length, products: inactiveProducts }
      });
    }

    // 3. Páginas de Alta Performance
    const avgPageConversion = pages.reduce((sum, p) => sum + p.conversionRate, 0) / pages.length || 1;
    const highPerformingPages = pages.filter(p => p.conversionRate > avgPageConversion * 1.5 && p.conversionRate > 5);

    if (highPerformingPages.length > 0) {
      const topPage = highPerformingPages[0];
      detectedInsights.push({
        id: 'high-performing-page',
        type: 'success',
        category: 'page',
        title: 'Página de Alta Conversão Detectada',
        description: `A página "${topPage.pagePath}" tem ${topPage.conversionRate.toFixed(1)}% de conversão (média: ${avgPageConversion.toFixed(1)}%)`,
        impact: 'high',
        recommendation: 'Analise os elementos dessa página e replique em outras páginas para aumentar as conversões globais.',
        data: { page: topPage }
      });
    }

    // 4. Alerta de Abandono de Carrinho
    if (metrics.cartAbandonmentRate > 70) {
      detectedInsights.push({
        id: 'cart-abandonment-alert',
        type: 'warning',
        category: 'funnel',
        title: 'Taxa de Abandono de Carrinho Elevada',
        description: `${metrics.cartAbandonmentRate.toFixed(1)}% dos carrinhos são abandonados antes da compra`,
        impact: 'high',
        recommendation: 'Implemente recuperação de carrinho via email/WhatsApp, simplifique o checkout ou revise taxas de frete.',
        data: { rate: metrics.cartAbandonmentRate }
      });
    }

    // 5. Produtos em Crescimento
    if (previousMetrics && products.length > 0) {
      const growingProducts = products.filter(p => {
        const badge = p.badges?.find(b => b === 'growth');
        return badge !== undefined;
      });

      if (growingProducts.length > 0) {
        const topGrowing = growingProducts[0];
        detectedInsights.push({
          id: 'growing-product',
          type: 'success',
          category: 'product',
          title: 'Produto em Crescimento Acelerado',
          description: `"${topGrowing.productName}" teve crescimento significativo em vendas vs. período anterior`,
          impact: 'medium',
          recommendation: 'Aumente o estoque, destaque na home e considere criar variações ou bundles desse produto.',
          data: { product: topGrowing }
        });
      }
    }

    // 6. Oportunidade de Upsell
    const lowTicketHighVolume = products.filter(p => 
      p.averagePrice < metrics.averageOrderValue * 0.6 && p.purchases > 10
    );

    if (lowTicketHighVolume.length > 0) {
      const topCandidate = lowTicketHighVolume[0];
      detectedInsights.push({
        id: 'upsell-opportunity',
        type: 'opportunity',
        category: 'revenue',
        title: 'Oportunidade de Upsell Identificada',
        description: `"${topCandidate.productName}" tem ${topCandidate.purchases} vendas mas ticket médio baixo (R$ ${topCandidate.averagePrice.toFixed(2)})`,
        impact: 'medium',
        recommendation: 'Ofereça versão premium, bundle com produtos complementares ou serviços adicionais para aumentar o ticket médio.',
        data: { product: topCandidate }
      });
    }

    // 7. Crescimento de Receita Positivo
    if (previousMetrics && metrics.totalRevenue > previousMetrics.totalRevenue) {
      const growth = ((metrics.totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue * 100);
      if (growth > 20) {
        detectedInsights.push({
          id: 'revenue-growth',
          type: 'success',
          category: 'revenue',
          title: 'Crescimento Forte de Receita',
          description: `A receita cresceu ${growth.toFixed(1)}% comparado ao período anterior (R$ ${previousMetrics.totalRevenue.toFixed(2)} → R$ ${metrics.totalRevenue.toFixed(2)})`,
          impact: 'high',
          recommendation: 'Continue investindo nas estratégias atuais. Documente o que está funcionando para replicar o sucesso.',
          data: { growth, current: metrics.totalRevenue, previous: previousMetrics.totalRevenue }
        });
      }
    }

    // 8. Baixa Taxa de Conversão Geral
    if (metrics.conversionRate < 2 && metrics.productViews > 100) {
      detectedInsights.push({
        id: 'low-conversion-rate',
        type: 'warning',
        category: 'funnel',
        title: 'Taxa de Conversão Abaixo do Ideal',
        description: `Apenas ${metrics.conversionRate.toFixed(2)}% das visualizações resultam em compras`,
        impact: 'high',
        recommendation: 'Revise preços, melhore fotos dos produtos, adicione avaliações e simplifique o processo de compra.',
        data: { rate: metrics.conversionRate }
      });
    }

    return detectedInsights;
  }, [metrics, previousMetrics, products, pages]);

  const healthScore = useMemo<HealthScore>(() => {
    if (!metrics || !products || !pages) {
      return {
        score: 0,
        status: 'poor',
        breakdown: {
          conversionRate: 0,
          cartAbandonment: 0,
          revenueGrowth: 0,
          productDiversity: 0,
          pagePerformance: 0
        }
      };
    }

    // 1. Taxa de Conversão (peso 30%) - ideal > 3%
    const conversionScore = Math.min((metrics.conversionRate / 3) * 100, 100) * 0.30;

    // 2. Taxa de Abandono de Carrinho Invertida (peso 20%) - ideal < 60%
    const abandonmentScore = Math.max(100 - (metrics.cartAbandonmentRate / 60) * 100, 0) * 0.20;

    // 3. Crescimento de Receita (peso 25%)
    let revenueGrowthScore = 50; // neutro
    if (previousMetrics && previousMetrics.totalRevenue > 0) {
      const growth = ((metrics.totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue * 100);
      revenueGrowthScore = Math.max(0, Math.min(50 + growth, 100));
    }
    const revenueScore = revenueGrowthScore * 0.25;

    // 4. Diversificação de Produtos (peso 15%) - ideal > 5 produtos vendidos
    const activeProducts = products.filter(p => p.purchases > 0).length;
    const diversityScore = Math.min((activeProducts / 5) * 100, 100) * 0.15;

    // 5. Performance das Páginas (peso 10%) - páginas com boa conversão
    const avgPageConversion = pages.reduce((sum, p) => sum + p.conversionRate, 0) / pages.length || 0;
    const pageScore = Math.min((avgPageConversion / 5) * 100, 100) * 0.10;

    const totalScore = Math.round(conversionScore + abandonmentScore + revenueScore + diversityScore + pageScore);

    let status: HealthScore['status'];
    if (totalScore >= 80) status = 'excellent';
    else if (totalScore >= 60) status = 'good';
    else if (totalScore >= 40) status = 'fair';
    else status = 'poor';

    return {
      score: totalScore,
      status,
      breakdown: {
        conversionRate: Math.round(conversionScore / 0.30),
        cartAbandonment: Math.round(abandonmentScore / 0.20),
        revenueGrowth: Math.round(revenueScore / 0.25),
        productDiversity: Math.round(diversityScore / 0.15),
        pagePerformance: Math.round(pageScore / 0.10)
      }
    };
  }, [metrics, previousMetrics, products, pages]);

  return { insights, healthScore };
};
