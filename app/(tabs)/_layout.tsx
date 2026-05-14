import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { Href } from 'expo-router';
import { Tabs, router } from 'expo-router';

import TabBar, { TabKey } from '@/components/navigation/TabBar';

const routeToTab: Record<string, TabKey> = {
  index: 'home',
  explore: 'search',
  solicitacoes: 'rides',
  profile: 'profile',
};

const tabToHref: Record<TabKey, Href> = {
  home: '/(tabs)',
  search: '/(tabs)/explore',
  rides: '/(tabs)/solicitacoes',
  chat: '/(tabs)',
  profile: '/(tabs)/profile',
};

function CustomTabBar(props: BottomTabBarProps) {
  const activeRoute = props.state.routes[props.state.index]?.name ?? 'index';
  const activeTab = routeToTab[activeRoute] ?? 'home';

  return (
    <TabBar
      activeTab={activeTab}
      onTabPress={(tab) => router.push(tabToHref[tab])}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorar', href: null }} />
      <Tabs.Screen name="solicitacoes" options={{ title: 'Solicitações' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
