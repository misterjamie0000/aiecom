import { useState } from 'react';
import { HelpCircle, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface FeatureGuideProps {
  feature: 'flash-sales' | 'bundles' | 'bxgy' | 'recommendations';
}

const FEATURE_GUIDES = {
  'flash-sales': {
    title: {
      en: 'Flash Sales',
      hi: 'फ्लैश सेल',
    },
    description: {
      en: 'Create time-limited sales with countdown timers to boost urgency and conversions.',
      hi: 'काउंटडाउन टाइमर के साथ समय-सीमित सेल बनाएं जो तात्कालिकता और बिक्री बढ़ाएं।',
    },
    whatIs: {
      en: 'Flash Sales are limited-time promotional events where products are offered at significant discounts. They create urgency and encourage impulse purchases.',
      hi: 'फ्लैश सेल सीमित समय के प्रमोशनल इवेंट हैं जहां प्रोडक्ट्स भारी छूट पर दिए जाते हैं। ये तात्कालिकता पैदा करते हैं और तुरंत खरीदारी को प्रोत्साहित करते हैं।',
    },
    howToUse: {
      en: [
        'Click "Create Flash Sale" to start a new sale',
        'Set a name, discount type (percentage or fixed), and discount value',
        'Choose start and end dates/times for the sale',
        'Optionally set max uses to limit availability',
        'Click the package icon to add specific products to the sale',
        'Products can have special sale prices different from the global discount',
        'Toggle the Active switch to enable/disable the sale',
      ],
      hi: [
        '"Create Flash Sale" पर क्लिक करके नई सेल शुरू करें',
        'नाम, डिस्काउंट टाइप (प्रतिशत या फिक्स्ड), और डिस्काउंट वैल्यू सेट करें',
        'सेल के लिए शुरू और समाप्त तारीख/समय चुनें',
        'उपलब्धता सीमित करने के लिए वैकल्पिक रूप से max uses सेट करें',
        'पैकेज आइकन पर क्लिक करके विशेष प्रोडक्ट्स जोड़ें',
        'प्रोडक्ट्स की सेल प्राइस ग्लोबल डिस्काउंट से अलग हो सकती है',
        'सेल को चालू/बंद करने के लिए Active स्विच टॉगल करें',
      ],
    },
  },
  'bundles': {
    title: {
      en: 'Product Bundles',
      hi: 'प्रोडक्ट बंडल',
    },
    description: {
      en: 'Create combo packages with multiple products at a discounted price.',
      hi: 'कई प्रोडक्ट्स के साथ डिस्काउंटेड प्राइस पर कॉम्बो पैकेज बनाएं।',
    },
    whatIs: {
      en: 'Product Bundles combine multiple products into a single package sold at a special price. This increases average order value and helps move inventory.',
      hi: 'प्रोडक्ट बंडल कई प्रोडक्ट्स को एक पैकेज में जोड़ते हैं जो स्पेशल प्राइस पर बेचा जाता है। इससे औसत ऑर्डर वैल्यू बढ़ती है और इन्वेंटरी बिकती है।',
    },
    howToUse: {
      en: [
        'Click "Create Bundle" to start',
        'Enter bundle name, description, and bundle price',
        'Add an image URL for the bundle display',
        'Optionally set start/end dates for limited-time bundles',
        'Click "Items" button on a bundle to add products',
        'Select products and set quantity for each',
        'The system calculates original price and discount automatically',
      ],
      hi: [
        'शुरू करने के लिए "Create Bundle" पर क्लिक करें',
        'बंडल का नाम, विवरण, और बंडल प्राइस डालें',
        'बंडल डिस्प्ले के लिए इमेज URL जोड़ें',
        'सीमित समय के बंडल के लिए वैकल्पिक रूप से शुरू/समाप्त तारीखें सेट करें',
        'प्रोडक्ट्स जोड़ने के लिए बंडल पर "Items" बटन क्लिक करें',
        'प्रोडक्ट्स चुनें और प्रत्येक की मात्रा सेट करें',
        'सिस्टम ओरिजिनल प्राइस और डिस्काउंट ऑटोमैटिक कैलकुलेट करता है',
      ],
    },
  },
  'bxgy': {
    title: {
      en: 'Buy X Get Y Offers',
      hi: 'Buy X Get Y ऑफर',
    },
    description: {
      en: 'Create promotional offers like "Buy 2 Get 1 Free" to boost sales.',
      hi: '"2 खरीदें 1 फ्री पाएं" जैसे प्रमोशनल ऑफर बनाकर बिक्री बढ़ाएं।',
    },
    whatIs: {
      en: 'BXGY (Buy X Get Y) offers are promotional deals where customers receive free or discounted products when they purchase a certain quantity. Common examples: Buy 2 Get 1 Free, Buy 3 Get 50% off on 4th.',
      hi: 'BXGY (Buy X Get Y) ऑफर प्रमोशनल डील हैं जहां ग्राहकों को एक निश्चित मात्रा खरीदने पर फ्री या डिस्काउंटेड प्रोडक्ट मिलते हैं। उदाहरण: 2 खरीदें 1 फ्री पाएं, 3 खरीदें 4थे पर 50% छूट।',
    },
    howToUse: {
      en: [
        'Click "Create Offer" to start',
        'Set "Buy Condition": choose product or category, set quantity',
        'Set "Get Condition": choose what customer receives',
        'Select discount type: Free (100% off), Percentage, or Fixed amount',
        'Set validity period and usage limits',
        'Per Customer Limit controls how many times each customer can use',
        'Example: Buy 2 shirts → Get 1 shirt FREE',
      ],
      hi: [
        'शुरू करने के लिए "Create Offer" पर क्लिक करें',
        '"Buy Condition" सेट करें: प्रोडक्ट या कैटेगरी चुनें, मात्रा सेट करें',
        '"Get Condition" सेट करें: ग्राहक को क्या मिलेगा चुनें',
        'डिस्काउंट टाइप चुनें: फ्री (100% छूट), प्रतिशत, या फिक्स्ड अमाउंट',
        'वैधता अवधि और उपयोग सीमा सेट करें',
        'Per Customer Limit - प्रत्येक ग्राहक कितनी बार उपयोग कर सकता है',
        'उदाहरण: 2 शर्ट खरीदें → 1 शर्ट फ्री पाएं',
      ],
    },
  },
  'recommendations': {
    title: {
      en: 'Product Recommendations',
      hi: 'प्रोडक्ट सिफारिशें',
    },
    description: {
      en: 'Set up product recommendations to increase cross-selling and upselling.',
      hi: 'क्रॉस-सेलिंग और अपसेलिंग बढ़ाने के लिए प्रोडक्ट सिफारिशें सेट करें।',
    },
    whatIs: {
      en: 'Product Recommendations suggest related products to customers based on their browsing/purchase history. This helps increase average order value by showing "Frequently Bought Together", "You May Also Like", etc.',
      hi: 'प्रोडक्ट सिफारिशें ग्राहकों को उनके ब्राउज़िंग/खरीद इतिहास के आधार पर संबंधित प्रोडक्ट सुझाती हैं। "अक्सर एक साथ खरीदे गए", "आपको ये भी पसंद आ सकता है" दिखाकर औसत ऑर्डर वैल्यू बढ़ाती हैं।',
    },
    howToUse: {
      en: [
        'Click "Auto-Generate" to create recommendations based on order history',
        'Or click "Add Recommendation" to manually link products',
        'Choose source product and recommended product',
        'Select recommendation type (Frequently Bought, Similar, Upsell, etc.)',
        'Types: Frequently Bought = same order, Similar = same category, Upsell = higher value, Cross-sell = complementary',
        'Score determines display priority (higher = shown first)',
        'Recommendations appear on product detail pages',
      ],
      hi: [
        'ऑर्डर हिस्ट्री के आधार पर सिफारिशें बनाने के लिए "Auto-Generate" क्लिक करें',
        'या प्रोडक्ट्स को मैन्युअली लिंक करने के लिए "Add Recommendation" क्लिक करें',
        'सोर्स प्रोडक्ट और रिकमेंडेड प्रोडक्ट चुनें',
        'सिफारिश टाइप चुनें (Frequently Bought, Similar, Upsell, आदि)',
        'टाइप्स: Frequently Bought = एक साथ खरीदे, Similar = एक कैटेगरी, Upsell = अधिक मूल्य, Cross-sell = पूरक',
        'स्कोर डिस्प्ले प्राथमिकता निर्धारित करता है (अधिक = पहले दिखाई देता है)',
        'सिफारिशें प्रोडक्ट डिटेल पेज पर दिखती हैं',
      ],
    },
  },
};

export function FeatureGuide({ feature }: FeatureGuideProps) {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const guide = FEATURE_GUIDES[feature];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          How to use
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {guide.title[lang]}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="gap-2"
            >
              <Languages className="h-4 w-4" />
              {lang === 'en' ? 'हिंदी' : 'English'}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground">{guide.description[lang]}</p>
          </div>

          {/* What is this feature */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Badge variant="secondary">
                {lang === 'en' ? 'What is it?' : 'यह क्या है?'}
              </Badge>
            </h3>
            <p className="text-sm leading-relaxed">{guide.whatIs[lang]}</p>
          </div>

          {/* How to use */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Badge variant="default">
                {lang === 'en' ? 'How to Use' : 'कैसे उपयोग करें'}
              </Badge>
            </h3>
            <ol className="space-y-2">
              {guide.howToUse[lang].map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Pro Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              💡 {lang === 'en' ? 'Pro Tips' : 'प्रो टिप्स'}
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {lang === 'en'
                ? 'Always test your offers before going live. Check how they appear on the frontend and ensure pricing is correct.'
                : 'लाइव जाने से पहले अपने ऑफर्स का टेस्ट करें। देखें कि वे फ्रंटएंड पर कैसे दिखते हैं और सुनिश्चित करें कि प्राइसिंग सही है।'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
