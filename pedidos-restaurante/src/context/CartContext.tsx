import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type ProductoCarrito = {
  id: number;
  name: string;
  price: string;
  image_url: string | null;
};

type ItemCarrito = {
  producto: ProductoCarrito;
  cantidad: number;
};

type CartContextType = {
  items: ItemCarrito[];
  cantidadTotal: number;
  totalCentavos: number;
  agregarProducto: (producto: ProductoCarrito) => void;
  cambiarCantidad: (productoId: number, cantidad: number) => void;
  eliminarProducto: (productoId: number) => void;
  vaciarCarrito: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// Convierte precios como "89.00" a 8900 centavos.
function precioEnCentavos(precio: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(precio)) {
    throw new Error('El producto tiene un precio inválido.');
  }

  const [pesos, decimales = ''] = precio.split('.');

  return Number(pesos) * 100 + Number(decimales.padEnd(2, '0'));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);

  function agregarProducto(producto: ProductoCarrito) {
    precioEnCentavos(producto.price);

    setItems((anteriores) => {
      const existe = anteriores.some(
        (item) => item.producto.id === producto.id
      );

      if (existe) {
        return anteriores.map((item) =>
          item.producto.id === producto.id
            ? {
                producto,
                cantidad: Math.min(item.cantidad + 1, 99),
              }
            : item
        );
      }

      return [...anteriores, { producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(productoId: number, cantidad: number) {
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
      return;
    }

    setItems((anteriores) =>
      anteriores.map((item) =>
        item.producto.id === productoId
          ? { ...item, cantidad }
          : item
      )
    );
  }

  function eliminarProducto(productoId: number) {
    setItems((anteriores) =>
      anteriores.filter((item) => item.producto.id !== productoId)
    );
  }

  function vaciarCarrito() {
    setItems([]);
  }

  const cantidadTotal = items.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  const totalCentavos = items.reduce(
    (total, item) =>
      total + precioEnCentavos(item.producto.price) * item.cantidad,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        cantidadTotal,
        totalCentavos,
        agregarProducto,
        cambiarCantidad,
        eliminarProducto,
        vaciarCarrito,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const contexto = useContext(CartContext);

  if (!contexto) {
    throw new Error('useCart debe utilizarse dentro de CartProvider.');
  }

  return contexto;
}