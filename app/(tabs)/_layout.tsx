import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { Href } from 'expo-router';
import { Tabs, router } from 'expo-router';
import { View } from 'react-native';

import TabBar, { TabKey } from '@/components/navigation/TabBar';

const routeToTab: Record<string, TabKey> = {
  index: 'home',
  solicitacoes: 'rides',
  profile: 'profile',
};

const tabToHref: Record<TabKey, Href> = {
  home: '/(tabs)',
  rides: '/(tabs)/solicitacoes',
  profile: '/(tabs)/profile',
};

function CustomTabBar(props: BottomTabBarProps) {
  const activeRoute = props.state.routes[props.state.index]?.name ?? 'index';
  const activeTab = routeToTab[activeRoute] ?? 'home';

  return (
    <View  pointerEvents="box-none">
      <TabBar
        activeTab={activeTab}
        onTabPress={(tab) => router.push(tabToHref[tab])}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="solicitacoes" options={{ title: 'Solicitações' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
