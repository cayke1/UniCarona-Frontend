import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { Href } from 'expo-router';
import { View } from 'react-native';
import { Tabs, router } from 'expo-router';

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
    <View>
      <TabBar activeTab={activeTab} onTabPress={(tab) => router.push(tabToHref[tab])} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { flex: 1, backgroundColor: 'transparent' },
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          sceneStyle: { flex: 1, backgroundColor: 'transparent' },
        }}
      />
      <Tabs.Screen name="solicitacoes" options={{ title: 'Solicitações' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}