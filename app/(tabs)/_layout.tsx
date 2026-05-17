import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { Href } from 'expo-router';
import { View } from 'react-native';
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
    <View style={props.style}>
      <TabBar activeTab={activeTab} onTabPress={(tab) => router.push(tabToHref[tab])} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorar', href: null }} />
      <Tabs.Screen name="solicitacoes" options={{ title: 'Solicitações' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
