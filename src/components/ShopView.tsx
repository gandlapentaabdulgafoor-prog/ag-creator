import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ExternalLink,
  Search,
  Filter,
  ShieldCheck,
  Tag,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  Armchair,
  Tv,
  Layers,
  Info,
  Compass,
  Link as LinkIcon,
  Store,
  SlidersHorizontal,
  ChevronRight,
  Database,
  X,
  Eye,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  ShopCategory,
  AffiliatePartner,
  Product,
  AffiliateClick,
  AffiliateTransaction
} from '../types';
import {
  SHOP_CATEGORIES,
  AFFILIATE_PARTNERS,
  getProducts,
  recordAffiliateClick,
  getUserAffiliateClicks,
  getUserAffiliateTransactions,
  getAffiliatePartnersWithServerStatus
} from '../services/affiliateService';

interface ShopViewProps {
  onTabChange: (tab: any) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({ onTabChange }) => {
  const { currentUser, userProfile, setAuthModalOpen } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<AffiliatePartner[]>(AFFILIATE_PARTNERS);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [userClicks, setUserClicks] = useState<AffiliateClick[]>([]);
  const [userTransactions, setUserTransactions] = useState<AffiliateTransaction[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'partners' | 'tracking' | 'spec'>('catalog');
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [redirectToast, setRedirectToast] = useState<{
    show: boolean;
    partnerName: string;
    productTitle: string;
    deepLink: string;
    trackingId: string;
  } | null>(null);

  // Load products and tracking logs
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      setLoadingProducts(true);
      const data = await getProducts(selectedCategory === 'ALL' ? undefined : selectedCategory);
      if (isMounted) {
        setProducts(data);
        setLoadingProducts(false);
      }
    };
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  useEffect(() => {
    getAffiliatePartnersWithServerStatus().then(setPartners);
  }, []);

  useEffect(() => {
    if (currentUser?.uid) {
      getUserAffiliateClicks(currentUser.uid).then(setUserClicks);
      getUserAffiliateTransactions(currentUser.uid).then(setUserTransactions);
    } else {
      setUserClicks([]);
      setUserTransactions([]);
    }
  }, [currentUser, redirectToast]);

  const handleBuyNow = async (product: Product) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    const referrerUserId = userProfile?.referredByUid || null;
    const referralRecordId = referrerUserId ? `ref_${currentUser.uid}` : null;

    const provider = product.provider || product.partnerId || 'amazon';
    const partner = partners.find((p) => p.partnerId === provider) || AFFILIATE_PARTNERS.find((p) => p.partnerId === provider);

    // Myntra and Meesho remain unavailable to customers until officially configured and verified
    if ((provider === 'myntra' || provider === 'meesho') && partner?.status !== 'ACTIVE') {
      setRedirectToast({
        show: true,
        partnerName: `${partner?.name || provider.toUpperCase()} (NOT CONFIGURED)`,
        productTitle: product.title,
        deepLink: '',
        trackingId: 'UNAVAILABLE_NOT_CONFIGURED'
      });
      return;
    }

    const { click, deepLink } = await recordAffiliateClick(
      currentUser.uid,
      referrerUserId,
      product,
      referralRecordId
    );

    // Show transparent redirect notification
    setRedirectToast({
      show: true,
      partnerName: partner?.name || provider.toUpperCase(),
      productTitle: product.title,
      deepLink,
      trackingId: click.trackingId
    });

    // In a real browser context, safely open external link in new tab if valid link exists
    if (deepLink && (deepLink.startsWith('http://') || deepLink.startsWith('https://'))) {
      setTimeout(() => {
        window.open(deepLink, '_blank', 'noopener,noreferrer');
      }, 600);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return <Cpu size={16} />;
      case 'Smartphone': return <Smartphone size={16} />;
      case 'Shirt': return <Shirt size={16} />;
      case 'Home': return <Home size={16} />;
      case 'Sparkles': return <Sparkles size={16} />;
      case 'ShoppingBag': return <ShoppingBag size={16} />;
      case 'Armchair': return <Armchair size={16} />;
      case 'Tv': return <Tv size={16} />;
      case 'Layers': return <Layers size={16} />;
      case 'Tag': return <Tag size={16} />;
      default: return <ShoppingBag size={16} />;
    }
  };

  const filteredProducts = products.filter((prod) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const provider = (prod.provider || prod.partnerId || '').toLowerCase();
      const desc = (prod.description || '').toLowerCase();
      const extId = (prod.externalProductId || '').toLowerCase();
      return (
        prod.title.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q) ||
        provider.includes(q) ||
        desc.includes(q) ||
        extId.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Top Banner & Value Proposition */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/30">
              <ShoppingBag size={13} />
              <span>Affiliate Commerce & Rewards Foundation</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              AG Creator Shop & Rewards
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              Explore 10 curated product categories with provider-agnostic affiliate tracking. Shop through certified partners like Amazon, Flipkart, Myntra, and Meesho to earn verified loyalty points on genuine completed orders.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Zero Fake Inventory</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Server-Verified Click Tracking</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800">
                <Clock size={14} className="text-amber-400" />
                <span>Pending Commission Safeguard</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics / Status Card */}
          <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl shrink-0 min-w-[260px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Affiliate Pipeline
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PHASE 1 ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Active Categories:</span>
                <span className="font-bold text-white">10 Categories</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Integrated Partners:</span>
                <span className="font-bold text-white">{AFFILIATE_PARTNERS.length} Networks</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Your Click Audit Log:</span>
                <span className="font-bold text-emerald-400">{userClicks.length} recorded</span>
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('tracking')}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Compass size={14} />
              <span>View Your Click Audit Log</span>
            </button>
          </div>
        </div>
      </section>

      {/* View Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSubTab === 'catalog'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Store size={15} />
          <span>Shopping Catalog</span>
        </button>

        <button
          onClick={() => setActiveSubTab('partners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSubTab === 'partners'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <LinkIcon size={15} />
          <span>Affiliate Partners ({AFFILIATE_PARTNERS.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tracking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSubTab === 'tracking'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock size={15} />
          <span>Click & Transaction Tracking</span>
          {userClicks.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-900 text-emerald-400 text-[10px] font-bold">
              {userClicks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('spec')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSubTab === 'spec'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Database size={15} />
          <span>Architecture & Rules</span>
        </button>
      </div>

      {/* TAB 1: SHOPPING CATALOG & CATEGORY EXPLORER */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          {/* 10 Canonical Categories Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-emerald-400" />
                <span>Shop by Category (10 Canonical Categories)</span>
              </h2>
              {selectedCategory !== 'ALL' && (
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  View All Categories
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  selectedCategory === 'ALL'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${selectedCategory === 'ALL' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    <Compass size={16} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    ALL
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold">All Categories</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Explore full network</p>
                </div>
              </button>

              {SHOP_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {getCategoryIcon(cat.icon)}
                      </div>
                      {cat.id === 'Deals & Offers' && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          HOT
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold leading-tight line-clamp-1">{cat.name}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search products, categories, or affiliate partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {selectedCategory !== 'ALL' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Filter size={14} className="text-emerald-400" />
                <span>Filtered by: <strong>{selectedCategory}</strong></span>
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className="text-slate-500 hover:text-white ml-1 font-bold"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Products List or Professional Empty/Configuration State */}
          {loadingProducts ? (
            <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading catalog from Firestore /products...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const provider = product.provider || product.partnerId || 'partner';
                return (
                  <div
                    key={product.productId}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition group"
                  >
                    <div>
                      <div className="relative aspect-video w-full rounded-xl bg-slate-950/60 overflow-hidden mb-3 border border-slate-800/50 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <ShoppingBag size={28} className="text-slate-700" />
                        )}
                        <button
                          onClick={() => setSelectedProductForDetails(product)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition backdrop-blur-sm border border-slate-700/60"
                          title="View Product Details"
                        >
                          <Eye size={13} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                          {provider}
                        </span>
                        <span className="text-[10px] text-slate-500">{product.category}</span>
                      </div>

                      <h3 className="text-sm font-bold text-white line-clamp-2">{product.title}</h3>

                      {product.description && (
                        <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-slate-400">{product.currency}</span>
                          <span className="text-lg font-extrabold text-white">
                            {product.price.toLocaleString()}
                          </span>
                        </div>
                        {product.availability && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            product.availability === 'IN_STOCK'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : product.availability === 'OUT_OF_STOCK'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {product.availability.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProductForDetails(product)}
                        className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700/60 flex items-center justify-center gap-1 cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </button>

                      {product.productUrl && (product.productUrl.startsWith('http://') || product.productUrl.startsWith('https://')) ? (
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                        >
                          <span>Shop Now</span>
                          <ExternalLink size={13} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/60 text-slate-500 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-800/80"
                        >
                          <span>Unavailable</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Professional Empty State when no live affiliate product feed is configured */
            <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <Store size={30} />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block">
                  AG Creator Shop
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Products are being prepared
                </h3>
                <p className="text-sm font-semibold text-slate-300">
                  Affiliate partner catalog is not connected yet.
                </p>
                <p className="text-xs text-slate-400">
                  No products are currently available.
                </p>
              </div>

              {/* Status Section: Amazon, Flipkart and Myntra optional partner configuration */}
              <div className="p-4 sm:p-5 max-w-lg mx-auto rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800/80">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>Partner Integrations Status</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60">
                    Optional Integrations
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  {partners.map((p) => (
                    <div key={p.partnerId} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${p.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                          <span className="font-bold text-white text-xs">{p.name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-800/60 border-slate-700/60'}`}>
                          Status: {p.status === 'ACTIVE' ? 'ACTIVE' : 'NOT CONFIGURED'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] pt-1.5 border-t border-slate-800/60 text-slate-400 font-mono">
                        <div>Credentials: <span className={p.onboarding?.credentialsStatus === 'CONFIGURED' ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-semibold'}>{p.onboarding?.credentialsStatus || 'NOT CONFIGURED'}</span></div>
                        <div>Product Feed: <span className={p.onboarding?.productFeedStatus === 'CONFIGURED' ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-semibold'}>{p.onboarding?.productFeedStatus || 'NOT CONFIGURED'}</span></div>
                        <div>Tracking: <span className={p.onboarding?.trackingStatus === 'CONFIGURED' ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-semibold'}>{p.onboarding?.trackingStatus || 'NOT CONFIGURED'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 max-w-xl mx-auto rounded-2xl bg-slate-950/50 border border-slate-800/80 text-left text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-300">
                  <Info size={14} className="text-emerald-400" />
                  <span>Architecture & Integration Readiness:</span>
                </div>
                <div className="space-y-1 text-slate-400 text-[11px]">
                  <p>• <strong>10 Product Categories:</strong> Registered and ready for automated product catalog ingestion.</p>
                  <p>• <strong>Provider-Agnostic Interface:</strong> Prepared for official partner API credentials and real-time product feeds.</p>
                  <p>• <strong>Click Tracking Engine:</strong> Subtag and trackingId attribution active for future real partner clicks.</p>
                  <p>• <strong>Server-Authoritative Ledger:</strong> Commission and reward transactions remain strictly server-controlled.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveSubTab('partners')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LinkIcon size={14} />
                  <span>Review Partner Configuration</span>
                </button>
                <button
                  onClick={() => setActiveSubTab('spec')}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Database size={14} />
                  <span>Inspect Data Models & Schema</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AFFILIATE PARTNER ARCHITECTURE */}
      {activeSubTab === 'partners' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Provider-Agnostic Affiliate Partners
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                AG Creator integrates with official affiliate networks via deep-link tracking without storing sensitive credentials in client bundles.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <ShieldCheck size={13} />
              <span>Extensible Architecture</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold text-slate-200">Optional Partner Integrations Architecture</p>
                <p className="text-slate-400 text-[11px]">
                  All partner networks (Amazon Creators API, Flipkart Affiliate, Myntra) are optional and disabled by default. AG Creator runs normally without requiring affiliate environment variables.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full whitespace-nowrap self-start sm:self-auto border border-slate-700/50">
              Optional Integrations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {partners.map((partner) => (
              <div
                key={partner.partnerId}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {partner.shortName}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${partner.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-800/60 border-slate-700/60'}`}>
                      {partner.status === 'ACTIVE' ? 'Active' : 'Disabled / Not Configured'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{partner.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{partner.description}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Program:</span>
                      <span className="font-semibold text-slate-300">{partner.affiliateProgramName}</span>
                    </div>
                    {partner.officialApiName && (
                      <div className="flex justify-between text-slate-400">
                        <span>Catalog API:</span>
                        <span className="font-semibold text-emerald-400">{partner.officialApiName}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Tracking Param:</span>
                      <span className="font-mono text-emerald-400 font-bold">{partner.defaultTrackingParam}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Base Domain:</span>
                      <span className="text-slate-300 font-mono">{partner.baseUrl.replace('https://', '')}</span>
                    </div>
                  </div>

                  {/* Partner Onboarding / Configuration Status */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1.5 border-b border-slate-800/80">
                      <span>Integration Status</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${partner.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-800/40 border-slate-700/60'}`}>
                        {partner.status === 'ACTIVE' ? 'ACTIVE' : 'NOT CONFIGURED'}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-slate-400 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-sans">Status:</span>
                        <span className={partner.status === 'ACTIVE' ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-semibold'}>
                          {partner.status === 'ACTIVE' ? 'ACTIVE' : 'NOT CONFIGURED'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-sans">Credentials:</span>
                        <span className={partner.onboarding?.credentialsStatus === 'CONFIGURED' ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-semibold'}>
                          {partner.onboarding?.credentialsStatus || 'NOT CONFIGURED'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-sans">Product Feed:</span>
                        <span className={partner.onboarding?.productFeedStatus === 'CONFIGURED' ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-semibold'}>
                          {partner.onboarding?.productFeedStatus || 'NOT CONFIGURED'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-sans">Tracking:</span>
                        <span className={partner.onboarding?.trackingStatus === 'CONFIGURED' ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-semibold'}>
                          {partner.onboarding?.trackingStatus || 'NOT CONFIGURED'}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 leading-snug">
                      <span className={partner.status === 'ACTIVE' ? 'text-emerald-400 font-medium' : 'text-slate-400 font-medium'}>Readiness: </span>
                      {partner.onboarding?.readinessNotice || 'Integration optional and disabled.'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-300">Commission Policy: </span>
                    {partner.commissionNotice}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  {partner.status === 'ACTIVE' ? (
                    <a
                      href={partner.baseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5"
                    >
                      <span>Visit Official Platform</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <div className="w-full py-2 px-3 rounded-xl bg-slate-800/40 text-slate-500 text-xs font-semibold text-center border border-slate-800 cursor-not-allowed">
                      Unavailable • Integration Not Configured
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Integration Specification Card */}
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Database size={16} className="text-emerald-400" />
              <span>Extending New Affiliate Partners</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              New partners can be added effortlessly by registering an <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">AffiliatePartner</code> config in <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">src/services/affiliateService.ts</code>. No application rebuild or UI alteration is required. Deep link parameters and subtag schemes map cleanly to the partner's query specification.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: CLICK & TRANSACTION TRACKING LOGS */}
      {activeSubTab === 'tracking' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Affiliate Activity & Click Audit Trail
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Every outbound affiliate interaction generates a secure immutable record linking your account and inviter attribution.
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              ABAC Enforced • Owner-Readable
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Click Audit Log */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock size={15} className="text-emerald-400" />
                  <span>Your Outbound Click Trail ({userClicks.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">/affiliateClicks</span>
              </div>

              {!currentUser ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400">
                  <p>Please sign in to view your logged affiliate clicks.</p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="mt-3 px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    Sign In
                  </button>
                </div>
              ) : userClicks.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-500">
                  No affiliate clicks logged yet. Click any "Buy Now" button in the catalog to generate a verified tracking record.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {userClicks.map((click) => (
                    <div
                      key={click.clickId}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                          {click.partnerId}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(click.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium text-slate-200 line-clamp-1">{click.productTitle || click.productId}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-900">
                        <span>Track ID: {click.trackingId}</span>
                        {click.referralId ? (
                          <span className="text-emerald-400">Ref: {click.referralId.slice(0, 6)}...</span>
                        ) : (
                          <span className="text-slate-500">Direct</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction Lifecycle Status */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>Affiliate Purchases & Commissions ({userTransactions.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">/affiliateTransactions</span>
              </div>

              {!currentUser ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400">
                  <p>Please sign in to view your purchases and rewards.</p>
                </div>
              ) : userTransactions.length === 0 ? (
                <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                  <AlertCircle size={24} className="text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-300">No transactions recorded yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Under the OneAG business model, transactions are only credited when external affiliate postbacks confirm genuine completed orders. No fake purchases or mock commissions are ever generated.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {userTransactions.map((tx) => (
                    <div
                      key={tx.transactionId}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{tx.partnerId.toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.transactionStatus === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.transactionStatus === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {tx.transactionStatus}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Order Amount: {tx.purchaseAmount}</span>
                        <span className="font-bold text-emerald-400">+{tx.rewardAmount} PTS</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Transaction State Machine Lifecycle */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-2">
                <span className="font-bold text-slate-300">Supported Transaction State Machine:</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <span className="font-bold block">1. PENDING</span>
                    <span>Order placed with partner. Awaiting shipping & return period expiration.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <span className="font-bold block">2. CONFIRMED</span>
                    <span>Order delivered and verified. Referral reward points unlocked in ledger.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400">
                    <span className="font-bold block">3. CANCELLED</span>
                    <span>Order cancelled by customer before shipment. No commission attributed.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    <span className="font-bold block">4. REFUNDED</span>
                    <span>Item returned during return window. Commission reversed safely.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SPECIFICATION & COMPLIANCE */}
      {activeSubTab === 'spec' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>AG Creator Rewards & Compliance Rules</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h3 className="font-bold text-emerald-400">Referral Commission Rule</h3>
                <p className="text-slate-400">
                  Account registration or joining does <strong>NOT</strong> create an immediate referral reward. Referral rewards are created solely when the referred user completes an eligible genuine transaction/activity according to configured OneAG rules.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h3 className="font-bold text-emerald-400">Zero Simulated Data</h3>
                <p className="text-slate-400">
                  No mock purchases, fake products, fake commissions, or demo rewards exist in the codebase. When feeds are not yet provisioned, clean configuration states are displayed.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h3 className="font-bold text-emerald-400">Withdrawal Lock Status</h3>
                <p className="text-slate-400">
                  All points withdrawals remain strictly <strong>LOCKED</strong> during early access. Points reflect verified platform engagement, with no speculative or investment returns.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h3 className="font-bold text-emerald-400">Zero Multi-Level Marketing</h3>
                <p className="text-slate-400">
                  ONEAG strictly rejects MLM, matrix schemes, joining fees, recruitment commissions, and guaranteed income guarantees. All rewards originate strictly from legitimate affiliate commerce.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProductForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {selectedProductForDetails.provider || selectedProductForDetails.partnerId}
                  </span>
                  <span className="text-xs text-slate-400">
                    Category: <strong>{selectedProductForDetails.category}</strong>
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {selectedProductForDetails.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProductForDetails(null)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="aspect-square w-full rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden flex items-center justify-center">
                {selectedProductForDetails.imageUrl ? (
                  <img
                    src={selectedProductForDetails.imageUrl}
                    alt={selectedProductForDetails.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={48} className="text-slate-700" />
                )}
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Catalog Price</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-semibold text-slate-400">{selectedProductForDetails.currency}</span>
                      <span className="text-3xl font-black text-white">
                        {selectedProductForDetails.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {selectedProductForDetails.availability && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Availability:</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                        selectedProductForDetails.availability === 'IN_STOCK'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : selectedProductForDetails.availability === 'OUT_OF_STOCK'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {selectedProductForDetails.availability.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {selectedProductForDetails.externalProductId && (
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>External ID:</span>
                        <span className="font-mono text-slate-300 font-medium">{selectedProductForDetails.externalProductId}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Tracking Attribution:</span>
                        <span className="font-mono text-emerald-400 font-medium">Server Subtag & ClickId</span>
                      </div>
                    </div>
                  )}

                  {selectedProductForDetails.description && (
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Description</span>
                      <p className="text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
                        {selectedProductForDetails.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Reward & Transparency Guarantee */}
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck size={14} />
                    <span>Server-Authoritative Click & Reward Protection</span>
                  </div>
                  <p className="text-slate-400 leading-snug">
                    Clicking "Shop Now" generates a server-verified outbound tracking record before navigating to the partner platform. Reward points stay pending during the partner's return window and credit upon confirmed delivery.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setSelectedProductForDetails(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>

              {selectedProductForDetails.productUrl && (selectedProductForDetails.productUrl.startsWith('http://') || selectedProductForDetails.productUrl.startsWith('https://')) ? (
                <button
                  onClick={() => {
                    const prod = selectedProductForDetails;
                    setSelectedProductForDetails(null);
                    handleBuyNow(prod);
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                >
                  <span>Shop Now via {(selectedProductForDetails.provider || selectedProductForDetails.partnerId || 'Partner').toUpperCase()}</span>
                  <ExternalLink size={14} />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800/60 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-800/80"
                >
                  <span>Affiliate Link Unavailable</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transparent External Navigation Toast / Modal */}
      {redirectToast?.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl animate-fade-in text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={14} />
              <span>Click Registered & Logged</span>
            </span>
            <button
              onClick={() => setRedirectToast(null)}
              className="text-slate-500 hover:text-white text-xs font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-slate-300">
            Redirecting to <strong>{redirectToast.partnerName}</strong>. Your referral session is tracked under tracking tag:
          </p>
          <p className="font-mono text-[10px] text-emerald-300 bg-slate-950 p-2 rounded-lg border border-slate-800 break-all">
            {redirectToast.trackingId}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>External partner window opening...</span>
            <a
              href={redirectToast.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Proceed Now</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
