import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import CartScreen from './screens/CartScreen';
import ClerkWithProvider from './ClerkProvider';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ClerkWithProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Inicio">
          <Stack.Screen name="Inicio" component={HomeScreen} />
          <Stack.Screen name="Carrito" component={CartScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ClerkWithProvider>
  );
}
