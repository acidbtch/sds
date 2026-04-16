const fs = require('fs');

// 1. Fix App.tsx (Telegram BackButton & Fullscreen)
let appContent = fs.readFileSync('D:/Projects/sds/src/App.tsx', 'utf8');
appContent = appContent.replace(
  /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/,
  `useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    if (currentView === 'home') {
      tg.BackButton?.hide();
    } else {
      tg.BackButton?.show();
    }

    const handleBack = () => {
      if (currentView === 'contractors_catalog' && catalogSource === 'admin') {
        setCurrentView('admin_panel');
      } else if (previousView && previousView !== currentView) {
        setCurrentView(previousView);
      } else {
        setCurrentView('home');
      }
      setPreviousView('home');
    };

    if (tg.BackButton) {
      tg.BackButton.onClick(handleBack);
      return () => {
        tg.BackButton.offClick(handleBack);
      };
    }
  }, [currentView, previousView, catalogSource]);`
);
fs.writeFileSync('D:/Projects/sds/src/App.tsx', appContent);

// 2. Fix AuthContext.tsx (Logout on token expiry)
let authContent = fs.readFileSync('D:/Projects/sds/src/context/AuthContext.tsx', 'utf8');
authContent = authContent.replace(
  "console.error('Failed to fetch user profile:', error);\n      setUser(null);",
  "console.error('Failed to fetch user profile:', error);\n      localStorage.removeItem('access_token');\n      setUser(null);"
);
fs.writeFileSync('D:/Projects/sds/src/context/AuthContext.tsx', authContent);

// 3. Fix api.ts (JSON.parse crash)
let apiContent = fs.readFileSync('D:/Projects/sds/src/lib/api.ts', 'utf8');
apiContent = apiContent.replace(
  "const text = await response.text();\n    return text ? JSON.parse(text) : null;",
  "const text = await response.text();\n    try {\n      return text ? JSON.parse(text) : null;\n    } catch (e) {\n      if (response.ok) return text as any;\n      throw new ApiError(response.status, 'Invalid server response');\n    }"
);
fs.writeFileSync('D:/Projects/sds/src/lib/api.ts', apiContent);

// 4. Fix Home.tsx (Banner Modulo Zero)
let homeContent = fs.readFileSync('D:/Projects/sds/src/components/Home.tsx', 'utf8');
homeContent = homeContent.replace(
  "setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);",
  "setCurrentBannerIndex(prev => activeBanners.length > 0 ? (prev + 1) % activeBanners.length : 0);"
);
fs.writeFileSync('D:/Projects/sds/src/components/Home.tsx', homeContent);

// 5. Fix CustomerOrders.tsx (Banner Modulo Zero)
let coContent = fs.readFileSync('D:/Projects/sds/src/components/CustomerOrders.tsx', 'utf8');
coContent = coContent.replace(
  "setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);",
  "setCurrentBannerIndex(prev => activeBanners.length > 0 ? (prev + 1) % activeBanners.length : 0);"
);
fs.writeFileSync('D:/Projects/sds/src/components/CustomerOrders.tsx', coContent);

// 6. Fix DataContext.tsx (Admin Interval Overlap & Memory Leak)
let dcContent = fs.readFileSync('D:/Projects/sds/src/context/DataContext.tsx', 'utf8');
dcContent = dcContent.replace(
  /intervalId = setInterval\(\(\) => \{\n\s*refreshAdminData\(\);\n\s*\}, 20000\);/,
  `// Used setTimeout to prevent parallel request overlap
    const fetchLoop = async () => {
      if (document.visibilityState === 'visible') {
        await refreshAdminData().catch(() => {});
      }
      intervalId = setTimeout(fetchLoop, 20000);
    };
    intervalId = setTimeout(fetchLoop, 20000);`
);
dcContent = dcContent.replace(
  "let intervalId: ReturnType<typeof setInterval> | null = null;",
  "let intervalId: ReturnType<typeof setTimeout> | null = null;"
);
dcContent = dcContent.replace(
  "clearInterval(intervalId);",
  "clearTimeout(intervalId);"
);
fs.writeFileSync('D:/Projects/sds/src/context/DataContext.tsx', dcContent);

console.log('All remaining bugs fixed successfully!');
