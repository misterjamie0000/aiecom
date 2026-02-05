import { Link } from 'react-router-dom';
import { Sparkles, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePublicCmsPages } from '@/hooks/usePublicCmsPage';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: cmsPages } = usePublicCmsPages();

  const footerLinks = {
    shop: [
      { label: 'All Products', href: '/products' },
      { label: 'New Arrivals', href: '/new-arrivals' },
      { label: 'Bestsellers', href: '/bestsellers' },
      { label: 'Offers & Deals', href: '/offers' },
    ],
    categories: [
      { label: 'Skin Care', href: '/category/skin-care' },
      { label: 'Hair Care', href: '/category/hair-care' },
      { label: 'Body Care', href: '/category/body-care' },
      { label: 'Personal Hygiene', href: '/category/personal-hygiene' },
    ],
    support: cmsPages?.filter(p => 
      ['contact-us', 'faqs', 'shipping-policy', 'return-policy'].includes(p.slug)
    ).map(p => ({ label: p.title, href: `/${p.slug}` })) || [],
    company: cmsPages?.filter(p => 
      ['about-us', 'privacy-policy', 'terms-and-conditions'].includes(p.slug)
    ).map(p => ({ label: p.title, href: `/${p.slug}` })) || [],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        {/* Newsletter Section */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h3 className="text-2xl font-bold mb-2">Stay Beautiful</h3>
          <p className="text-muted-foreground mb-4">
            Subscribe to get special offers, free giveaways, and beauty tips.
          </p>
          <form className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl">GlowMart</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Your trusted destination for premium beauty and personal care products.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              {footerLinks.categories.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap justify-center gap-6 py-6 border-t border-b text-sm text-muted-foreground">
          <a href="mailto:support@glowmart.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <Mail className="w-4 h-4" />
            support@glowmart.com
          </a>
          <a href="tel:+911234567890" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <Phone className="w-4 h-4" />
            +91 12345 67890
          </a>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Mumbai, India
          </span>
        </div>

        {/* Copyright */}
        <div className="pt-6 text-center text-sm text-muted-foreground">
          <p>© {currentYear} GlowMart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
