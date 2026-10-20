-- Productos iniciales. Las imágenes viven en public/products y se sirven desde el propio sitio.
-- Ejecutar en el SQL Editor después de la migración y de dar el rol seller al usuario.
insert into public.products
  (user_id, name, description, price, offer_price, stock, image_urls, category, subcategory, video, is_active)
values
  (
    'c62a5272-da79-4558-95ca-12c832c25204',
    'Zebra TC15 Computador móvil Android',
    'Computador móvil Android de 6.5" con diseño robusto y escáner de código de barras integrado. Ideal para retail, logística y atención en campo. Conectividad 5G/Wi-Fi 6, cámara de alta resolución y batería de larga duración para turnos completos.',
    1890.00, 1690.00, 25, array['/products/tc15.png'],
    'computo-movil', 'computadores-de-mano', '', true
  ),
  (
    'c62a5272-da79-4558-95ca-12c832c25204',
    'Honeywell EDA52 Computador móvil empresarial',
    'Computador móvil Android de 5.5" con pantalla Corning Gorilla Glass, escáner 2D integrado y carcasa resistente a caídas. Pensado para entrega de última milla, inventario y servicio en campo con gestión empresarial de dispositivos.',
    1250.00, 1150.00, 30, array['/products/eda52.png'],
    'computo-movil', 'computadores-de-mano', '', true
  ),
  (
    'c62a5272-da79-4558-95ca-12c832c25204',
    'Zebra ET65 Tableta empresarial',
    'Tableta empresarial de 12" con Windows y pantalla táctil legible a plena luz del día. Compatible con teclado y accesorios de montaje. Diseñada para almacenes, manufactura y ventas en campo.',
    2450.00, 2290.00, 12, array['/products/et65.png'],
    'computo-movil', 'tabletas', '', true
  ),
  (
    'c62a5272-da79-4558-95ca-12c832c25204',
    'Zebra HC100 Impresora de brazaletes',
    'Impresora térmica directa de brazaletes de identificación para hospitales, eventos y parques. Carga de cartuchos en segundos, impresión de códigos de barras y texto con alta resolución y diseño antimicrobiano fácil de limpiar.',
    780.00, 720.00, 18, array['/products/hc100.png'],
    'codigo-de-barras', 'impresoras-brazaletes', '', true
  ),
  (
    'c62a5272-da79-4558-95ca-12c832c25204',
    'Adaptador Zebra RFD40 para TC2X',
    'Adaptador de montaje para conectar el lector RFID RFD40 UHF a los computadores móviles Zebra TC2X. Mantiene el equipo firme y alineado para lecturas RFID de largo alcance en inventario y control de activos.',
    120.00, 99.00, 40, array['/products/adp-rfd40-tc2x.png'],
    'rfid', 'antenas', '', true
  );
