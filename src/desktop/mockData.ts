// Mock data for all desktop backoffice modules

export const mockProdutos = [
  { id: '1', title: 'The Legend of Zelda: TOTK', description: 'Aventura épica em mundo aberto', category: 'Jogos Digitais', platform: 'Nintendo Switch', price: 299.90, cost_price: 180.00, stock: 45, stock_alert_threshold: 10, product_type: 'digital' as const, is_active: true, image_url: 'https://placehold.co/80x80/14B8A6/fff?text=Zelda', supplier: 'Nintendo Brasil', rating: 4.8, created_at: '2025-01-15' },
  { id: '2', title: 'God of War Ragnarök', description: 'Ação e aventura nórdica', category: 'Jogos Físicos', platform: 'PS5', price: 249.90, cost_price: 150.00, stock: 32, stock_alert_threshold: 8, product_type: 'physical' as const, is_active: true, image_url: 'https://placehold.co/80x80/A855F7/fff?text=GoW', supplier: 'Sony Interactive', rating: 4.9, created_at: '2025-02-10' },
  { id: '3', title: 'Controle DualSense Edge', description: 'Controle premium PS5', category: 'Acessórios', platform: 'PS5', price: 1299.90, cost_price: 900.00, stock: 3, stock_alert_threshold: 5, product_type: 'physical' as const, is_active: true, image_url: 'https://placehold.co/80x80/EF4444/fff?text=Ctrl', supplier: 'Sony Interactive', rating: 4.5, created_at: '2025-03-01' },
  { id: '4', title: 'Xbox Game Pass Ultimate 3M', description: 'Assinatura 3 meses', category: 'Assinaturas', platform: 'Xbox / PC', price: 149.90, cost_price: 100.00, stock: 999, stock_alert_threshold: 50, product_type: 'subscription' as const, is_active: true, image_url: 'https://placehold.co/80x80/22C55E/fff?text=GP', supplier: 'Microsoft', rating: 4.7, created_at: '2025-01-20' },
  { id: '5', title: 'Headset HyperX Cloud III', description: 'Headset gamer 7.1', category: 'Acessórios', platform: 'Multiplataforma', price: 599.90, cost_price: 350.00, stock: 12, stock_alert_threshold: 5, product_type: 'physical' as const, is_active: true, image_url: 'https://placehold.co/80x80/F59E0B/fff?text=HX', supplier: 'HyperX Distribuidora', rating: 4.6, created_at: '2025-02-15' },
  { id: '6', title: 'Elden Ring', description: 'RPG de ação em mundo aberto', category: 'Jogos Digitais', platform: 'PC / PS5 / Xbox', price: 199.90, cost_price: 120.00, stock: 0, stock_alert_threshold: 10, product_type: 'digital' as const, is_active: false, image_url: 'https://placehold.co/80x80/6B7280/fff?text=ER', supplier: 'Bandai Namco', rating: 4.9, created_at: '2024-12-01' },
  { id: '7', title: 'Nintendo Switch OLED', description: 'Console Nintendo edição OLED', category: 'Consoles', platform: 'Nintendo Switch', price: 2499.90, cost_price: 1800.00, stock: 7, stock_alert_threshold: 3, product_type: 'physical' as const, is_active: true, image_url: 'https://placehold.co/80x80/3B82F6/fff?text=NSW', supplier: 'Nintendo Brasil', rating: 4.7, created_at: '2025-03-10' },
  { id: '8', title: 'PS5 Slim Digital', description: 'Console PlayStation 5 edição digital', category: 'Consoles', platform: 'PS5', price: 3499.90, cost_price: 2800.00, stock: 5, stock_alert_threshold: 3, product_type: 'physical' as const, is_active: true, image_url: 'https://placehold.co/80x80/8B5CF6/fff?text=PS5', supplier: 'Sony Interactive', rating: 4.8, created_at: '2025-01-05' },
];

export const mockFuncionarios = [
  { id: '1', display_name: 'Carlos Silva', email: 'carlos@midias.com', role: 'admin' as const, phone: '(11) 99999-0001', created_at: '2024-06-01', is_active: true },
  { id: '2', display_name: 'Ana Oliveira', email: 'ana@midias.com', role: 'atendente' as const, phone: '(11) 99999-0002', created_at: '2024-08-15', is_active: true },
  { id: '3', display_name: 'Pedro Santos', email: 'pedro@midias.com', role: 'atendente' as const, phone: '(11) 99999-0003', created_at: '2025-01-10', is_active: true },
  { id: '4', display_name: 'Maria Costa', email: 'maria@midias.com', role: 'atendente' as const, phone: '(11) 99999-0004', created_at: '2024-12-01', is_active: false },
];

export const mockClientes = [
  { id: '1', display_name: 'João Mendes', email: 'joao@email.com', phone: '(11) 98888-1111', cpf: '123.456.789-00', total_compras: 5, total_gasto: 1549.50, created_at: '2024-10-01' },
  { id: '2', display_name: 'Fernanda Lima', email: 'fernanda@email.com', phone: '(21) 97777-2222', cpf: '987.654.321-00', total_compras: 12, total_gasto: 4230.80, created_at: '2024-07-15' },
  { id: '3', display_name: 'Lucas Rocha', email: 'lucas@email.com', phone: '(31) 96666-3333', cpf: '456.789.123-00', total_compras: 3, total_gasto: 899.70, created_at: '2025-01-20' },
  { id: '4', display_name: 'Beatriz Alves', email: 'bia@email.com', phone: '(41) 95555-4444', cpf: '321.654.987-00', total_compras: 8, total_gasto: 2780.40, created_at: '2024-09-05' },
  { id: '5', display_name: 'Rafael Dias', email: 'rafael@email.com', phone: '(51) 94444-5555', cpf: '654.321.987-00', total_compras: 1, total_gasto: 299.90, created_at: '2025-03-01' },
];

export const mockFornecedores = [
  { id: '1', name: 'Nintendo Brasil', cnpj: '12.345.678/0001-01', contact_name: 'Roberto Yamada', email: 'contato@nintendo.com.br', phone: '(11) 3333-1111', is_active: true, produtos_count: 15, notes: 'Distribuidor oficial Nintendo' },
  { id: '2', name: 'Sony Interactive', cnpj: '23.456.789/0001-02', contact_name: 'Patricia Souza', email: 'comercial@sony.com.br', phone: '(11) 3333-2222', is_active: true, produtos_count: 22, notes: 'PlayStation e acessórios' },
  { id: '3', name: 'Microsoft', cnpj: '34.567.890/0001-03', contact_name: 'André Lima', email: 'parceiros@microsoft.com', phone: '(11) 3333-3333', is_active: true, produtos_count: 18, notes: 'Xbox e Game Pass' },
  { id: '4', name: 'HyperX Distribuidora', cnpj: '45.678.901/0001-04', contact_name: 'Marcos Vieira', email: 'vendas@hyperx.com.br', phone: '(11) 3333-4444', is_active: true, produtos_count: 8, notes: 'Periféricos gamer' },
  { id: '5', name: 'Bandai Namco', cnpj: '56.789.012/0001-05', contact_name: 'Yuki Tanaka', email: 'latam@bandainamco.com', phone: '(11) 3333-5555', is_active: false, produtos_count: 6, notes: 'Distribuidor de jogos japoneses' },
];

export const mockCategorias = [
  { id: '1', name: 'Jogos Digitais', description: 'Keys e códigos digitais', produtos_count: 45, image_url: 'https://placehold.co/120x80/14B8A6/fff?text=Digital' },
  { id: '2', name: 'Jogos Físicos', description: 'Mídias físicas (disco/cartucho)', produtos_count: 38, image_url: 'https://placehold.co/120x80/A855F7/fff?text=Físico' },
  { id: '3', name: 'Consoles', description: 'Consoles de videogame', produtos_count: 12, image_url: 'https://placehold.co/120x80/3B82F6/fff?text=Console' },
  { id: '4', name: 'Acessórios', description: 'Controles, headsets, cabos', produtos_count: 25, image_url: 'https://placehold.co/120x80/F59E0B/fff?text=Acess.' },
  { id: '5', name: 'Assinaturas', description: 'Game Pass, PS Plus, etc.', produtos_count: 8, image_url: 'https://placehold.co/120x80/22C55E/fff?text=Subs' },
  { id: '6', name: 'Retro', description: 'Jogos e consoles clássicos', produtos_count: 15, image_url: 'https://placehold.co/120x80/EF4444/fff?text=Retro' },
  { id: '7', name: 'PC Gaming', description: 'Periféricos e componentes PC', produtos_count: 20, image_url: 'https://placehold.co/120x80/8B5CF6/fff?text=PC' },
  { id: '8', name: 'Colecionáveis', description: 'Figuras, steelbooks, edições limitadas', produtos_count: 10, image_url: 'https://placehold.co/120x80/EC4899/fff?text=Colec.' },
];

export const mockPedidosOnline = [
  { id: 'PED-001', cliente: 'Fernanda Lima', items: 3, total: 749.70, status: 'pending' as const, payment_method: 'PIX', created_at: '2025-04-05 14:30' },
  { id: 'PED-002', cliente: 'João Mendes', items: 1, total: 299.90, status: 'confirmed' as const, payment_method: 'Cartão de Crédito', created_at: '2025-04-05 10:15' },
  { id: 'PED-003', cliente: 'Beatriz Alves', items: 2, total: 549.80, status: 'processing' as const, payment_method: 'PIX', created_at: '2025-04-04 16:45' },
  { id: 'PED-004', cliente: 'Lucas Rocha', items: 1, total: 2499.90, status: 'shipped' as const, payment_method: 'Cartão 3x', created_at: '2025-04-03 09:20' },
  { id: 'PED-005', cliente: 'Rafael Dias', items: 4, total: 1199.60, status: 'delivered' as const, payment_method: 'Boleto', created_at: '2025-04-01 11:00' },
  { id: 'PED-006', cliente: 'Fernanda Lima', items: 1, total: 149.90, status: 'cancelled' as const, payment_method: 'PIX', created_at: '2025-03-30 18:30' },
];

export const mockVendasPresenciais = [
  { id: 'VP-001', cliente: 'João Mendes', funcionario: 'Ana Oliveira', items: 2, subtotal: 549.80, desconto: 49.80, total: 500.00, payment_method: 'PIX', created_at: '2025-04-06 10:30' },
  { id: 'VP-002', cliente: 'Venda Anônima', funcionario: 'Pedro Santos', items: 1, subtotal: 299.90, desconto: 0, total: 299.90, payment_method: 'Dinheiro', created_at: '2025-04-06 11:15' },
  { id: 'VP-003', cliente: 'Beatriz Alves', funcionario: 'Ana Oliveira', items: 3, subtotal: 899.70, desconto: 89.97, total: 809.73, payment_method: 'Cartão 2x', created_at: '2025-04-05 15:00' },
  { id: 'VP-004', cliente: 'Venda Anônima', funcionario: 'Pedro Santos', items: 1, subtotal: 1299.90, desconto: 0, total: 1299.90, payment_method: 'Cartão de Crédito', created_at: '2025-04-05 09:45' },
];

export const mockMovimentacoes = [
  { id: '1', product: 'Controle DualSense Edge', type: 'entrada' as const, quantity: 10, quantity_before: 3, quantity_after: 13, employee: 'Carlos Silva', notes: 'Compra fornecedor Sony', created_at: '2025-04-06 08:00' },
  { id: '2', product: 'God of War Ragnarök', type: 'saida' as const, quantity: 2, quantity_before: 34, quantity_after: 32, employee: 'Ana Oliveira', notes: 'Venda presencial VP-001', created_at: '2025-04-06 10:30' },
  { id: '3', product: 'Nintendo Switch OLED', type: 'ajuste' as const, quantity: -1, quantity_before: 8, quantity_after: 7, employee: 'Carlos Silva', notes: 'Inventário - produto com defeito', created_at: '2025-04-05 18:00' },
  { id: '4', product: 'Xbox Game Pass Ultimate 3M', type: 'saida' as const, quantity: 5, quantity_before: 1004, quantity_after: 999, employee: 'Pedro Santos', notes: 'Pedido online PED-005', created_at: '2025-04-04 11:00' },
  { id: '5', product: 'Headset HyperX Cloud III', type: 'entrada' as const, quantity: 20, quantity_before: 12, quantity_after: 32, employee: 'Carlos Silva', notes: 'Reposição de estoque', created_at: '2025-04-03 14:30' },
];

export const mockDenuncias = [
  { id: '1', target_type: 'anuncio', target_title: 'PS5 usado - MEGA PROMOÇÃO!!!', reporter: 'Lucas Rocha', reason: 'Preço suspeito / possível golpe', status: 'pending', created_at: '2025-04-05 12:00' },
  { id: '2', target_type: 'usuario', target_title: 'user_gamer99', reporter: 'Fernanda Lima', reason: 'Spam de mensagens', status: 'pending', created_at: '2025-04-04 09:30' },
  { id: '3', target_type: 'anuncio', target_title: 'Conta Steam com 500 jogos', reporter: 'João Mendes', reason: 'Venda de contas é proibida', status: 'resolved', created_at: '2025-04-02 16:00' },
];

export const mockCertificados = [
  { id: '1', user: 'Lucas Rocha', status: 'pendente' as const, requested_at: '2025-04-05 10:00', reviewed_at: null, reason: null, expires_at: null },
  { id: '2', user: 'Beatriz Alves', status: 'ativo' as const, requested_at: '2025-03-01 14:00', reviewed_at: '2025-03-02 09:00', reason: 'Vendedora verificada', expires_at: '2025-09-02' },
  { id: '3', user: 'user_gamer99', status: 'recusado' as const, requested_at: '2025-02-20 11:00', reviewed_at: '2025-02-21 10:00', reason: 'Conta com denúncias pendentes', expires_at: null },
  { id: '4', user: 'Fernanda Lima', status: 'ativo' as const, requested_at: '2025-01-15 08:00', reviewed_at: '2025-01-16 09:30', reason: 'Histórico excelente', expires_at: '2026-01-16' },
  { id: '5', user: 'Rafael Dias', status: 'pendente' as const, requested_at: '2025-04-06 07:00', reviewed_at: null, reason: null, expires_at: null },
];

export const mockDashboardStats = {
  vendasHoje: 3,
  faturamentoHoje: 2099.63,
  faturamentoMes: 42580.90,
  pedidosPendentes: 2,
  estoqueBaixo: 3,
  totalClientes: 142,
  totalProdutos: 87,
  vendasSemana: [
    { dia: 'Seg', presencial: 1250, online: 890 },
    { dia: 'Ter', presencial: 980, online: 1200 },
    { dia: 'Qua', presencial: 1500, online: 750 },
    { dia: 'Qui', presencial: 870, online: 1100 },
    { dia: 'Sex', presencial: 2100, online: 1800 },
    { dia: 'Sáb', presencial: 3200, online: 2400 },
    { dia: 'Dom', presencial: 800, online: 1500 },
  ],
  topProdutos: [
    { name: 'Zelda: TOTK', vendas: 45 },
    { name: 'God of War', vendas: 38 },
    { name: 'Game Pass 3M', vendas: 32 },
    { name: 'PS5 Slim', vendas: 28 },
    { name: 'HyperX Cloud III', vendas: 22 },
  ],
};

export const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  processing: 'Em Separação',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400',
  shipped: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export const certStatusLabels: Record<string, string> = {
  pendente: 'Pendente',
  ativo: 'Ativo',
  recusado: 'Recusado',
  revogado: 'Revogado',
  expirado: 'Expirado',
};

export const certStatusColors: Record<string, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-400',
  ativo: 'bg-green-500/20 text-green-400',
  recusado: 'bg-red-500/20 text-red-400',
  revogado: 'bg-orange-500/20 text-orange-400',
  expirado: 'bg-muted text-muted-foreground',
};
