'use strict';

/**
 * Popula o banco com a carga inicial da Breck Barber:
 * 2 usuarios (1 admin + 1 cliente), 7 categorias, 28 produtos com estoque
 * e 3 pedidos historicos para os graficos ja nascerem com dados.
 *
 * Uso:  npm run seed
 */

require('dotenv').config();

const {
  sequelize, Usuario, Categoria, Produto, Estoque, Pedido, ItemPedido, Entrega,
} = require('../models');
const { calcularTotais } = require('../utils/desconto');
const { gerarCodigoPedido } = require('../utils/respostas');

// Placeholder em preto e branco, no mesmo contraste da loja.
const img = (texto, cor) =>
  `https://placehold.co/600x600/${cor}/ffffff/png?text=${encodeURIComponent(texto)}`;

const CATEGORIAS = [
  { nome: 'Pomadas e Finalizadores', segmento: 'CABELO', icone: 'pomada', descricao: 'Pomadas, ceras e pos texturizadores para a finalizacao do corte.' },
  { nome: 'Barba e Bigode', segmento: 'BARBA', icone: 'barba', descricao: 'Oleos, balms e ceras para hidratar, modelar e dar forma a barba.' },
  { nome: 'Cabelo e Couro Cabeludo', segmento: 'CABELO', icone: 'shampoo', descricao: 'Shampoos, tonicos e pos-barba para o cuidado diario.' },
  { nome: 'Maquinas e Aparadores', segmento: 'FERRAMENTA', icone: 'maquina', descricao: 'Maquinas de corte, trimmers e pentes guia profissionais.' },
  { nome: 'Navalhas e Tesouras', segmento: 'FERRAMENTA', icone: 'navalha', descricao: 'Navalhas, laminas e tesouras de acabamento em aco japones.' },
  { nome: 'Acessorios da Cadeira', segmento: 'FERRAMENTA', icone: 'acessorios', descricao: 'Capas, pinceis, borrifadores e toalhas do atendimento.' },
  { nome: 'Cursos e Vale-Presente', segmento: 'DIGITAL', icone: 'curso', descricao: 'Cursos, e-books e vale-presente com entrega imediata.' },
];

const PRODUTOS = [
  // ---------- Pomadas e Finalizadores ----------
  {
    codigo: 'POM-001', categoria: 'Pomadas e Finalizadores', nome: 'Pomada Modeladora Efeito Matte 150g', preco: 74.9,
    tipo: 'COSMETICO', linha: 'Cabelo', finalidade: 'Fixacao forte', marca: 'Breck', cor: '111111',
    descricao: 'Pomada de fixacao forte com acabamento seco, sem brilho, para penteados estruturados que aguentam o dia inteiro.',
    especificacoes: { peso_g: 150, fixacao: 'Forte (4/5)', brilho: 'Matte (sem brilho)', tipo_cabelo: 'Todos, especialmente lisos e ondulados', ingredientes_chave: 'Cera de carnauba, argila branca, oleo de ricino', aroma: 'Amadeirado seco', rendimento: 'Cerca de 60 aplicacoes' },
    quantidade: 48,
  },
  {
    codigo: 'POM-002', categoria: 'Pomadas e Finalizadores', nome: 'Pomada Base Agua Brilho Umido 120g', preco: 68.9,
    tipo: 'COSMETICO', linha: 'Cabelo', finalidade: 'Brilho e penteado classico', marca: 'Breck', cor: '111111',
    descricao: 'Base agua de facil remocao, ideal para penteados classicos com brilho controlado e repenteavel durante o dia.',
    especificacoes: { peso_g: 120, fixacao: 'Media (3/5)', brilho: 'Alto', tipo_cabelo: 'Lisos e ondulados', ingredientes_chave: 'Ceras vegetais, pantenol, glicerina', aroma: 'Citrico amadeirado', rendimento: 'Cerca de 50 aplicacoes' },
    quantidade: 36,
  },
  {
    codigo: 'POM-003', categoria: 'Pomadas e Finalizadores', nome: 'Cera Texturizadora Fibrosa 100g', preco: 59.9,
    tipo: 'COSMETICO', linha: 'Cabelo', finalidade: 'Textura e definicao', marca: 'Breck', cor: '111111',
    descricao: 'Cera fibrosa que separa os fios e cria textura no topo sem pesar, com acabamento natural.',
    especificacoes: { peso_g: 100, fixacao: 'Media alta (4/5)', brilho: 'Baixo', tipo_cabelo: 'Curtos e medios', ingredientes_chave: 'Cera de abelha, lanolina, manteiga de karite', aroma: 'Especiarias', rendimento: 'Cerca de 45 aplicacoes' },
    quantidade: 30,
  },
  {
    codigo: 'POM-004', categoria: 'Pomadas e Finalizadores', nome: 'Po Texturizador Volume Instantaneo 20g', preco: 49.9,
    tipo: 'COSMETICO', linha: 'Cabelo', finalidade: 'Volume na raiz', marca: 'Breck', cor: '111111',
    descricao: 'Po ultraleve que ergue a raiz e disfarca a falta de densidade capilar, com toque seco.',
    especificacoes: { peso_g: 20, fixacao: 'Media (3/5)', brilho: 'Nenhum', tipo_cabelo: 'Finos e com pouca densidade', ingredientes_chave: 'Silica amorfa', aroma: 'Sem fragrancia', rendimento: 'Cerca de 80 aplicacoes' },
    quantidade: 25,
  },

  // ---------- Barba e Bigode ----------
  {
    codigo: 'BRB-001', categoria: 'Barba e Bigode', nome: 'Oleo para Barba Madeira e Ambar 30ml', preco: 54.9,
    tipo: 'COSMETICO', linha: 'Barba', finalidade: 'Hidratacao', marca: 'Breck', cor: '171717',
    descricao: 'Blend de oleos vegetais que hidrata os fios, alivia a cocaira do crescimento e perfuma a barba.',
    especificacoes: { volume_ml: 30, tipo_barba: 'Curta, media e longa', ingredientes_chave: 'Oleo de jojoba, argan e semente de uva', aroma: 'Madeira e ambar', modo_uso: '3 a 5 gotas na barba umida', rendimento: 'Cerca de 60 aplicacoes' },
    quantidade: 52,
  },
  {
    codigo: 'BRB-002', categoria: 'Barba e Bigode', nome: 'Balm Modelador de Barba 60g', preco: 62.9,
    tipo: 'COSMETICO', linha: 'Barba', finalidade: 'Modelagem e nutricao', marca: 'Breck', cor: '171717',
    descricao: 'Balm com manteiga de karite que da leve fixacao, controla o volume e disciplina fios rebeldes.',
    especificacoes: { peso_g: 60, fixacao: 'Leve (2/5)', tipo_barba: 'Media e longa', ingredientes_chave: 'Manteiga de karite, cera de abelha, vitamina E', aroma: 'Tabaco e baunilha', rendimento: 'Cerca de 70 aplicacoes' },
    quantidade: 40,
  },
  {
    codigo: 'BRB-003', categoria: 'Barba e Bigode', nome: 'Shampoo Especifico para Barba 140ml', preco: 44.9,
    tipo: 'COSMETICO', linha: 'Barba', finalidade: 'Limpeza suave', marca: 'Breck', cor: '171717',
    descricao: 'Limpeza suave sem sulfato, remove residuos de balm e oleo sem ressecar a pele sob a barba.',
    especificacoes: { volume_ml: 140, tipo_barba: 'Todos os tamanhos', ingredientes_chave: 'Extrato de aloe vera, pantenol', aroma: 'Menta suave', livre_de: 'Sulfatos e parabenos', rendimento: 'Cerca de 45 lavagens' },
    quantidade: 44,
  },
  {
    codigo: 'BRB-004', categoria: 'Barba e Bigode', nome: 'Cera de Bigode Fixacao Extra 15g', preco: 34.9,
    tipo: 'COSMETICO', linha: 'Barba', finalidade: 'Fixacao extra', marca: 'Breck', cor: '171717',
    descricao: 'Cera dura para modelar pontas de bigode e manter o desenho por horas, mesmo em dia quente.',
    especificacoes: { peso_g: 15, fixacao: 'Extra forte (5/5)', tipo_barba: 'Bigode', ingredientes_chave: 'Cera de abelha e resina vegetal', aroma: 'Amadeirado', rendimento: 'Cerca de 90 aplicacoes' },
    quantidade: 33,
  },

  // ---------- Cabelo e Couro Cabeludo ----------
  {
    codigo: 'SHP-001', categoria: 'Cabelo e Couro Cabeludo', nome: 'Shampoo Antiqueda Cafeina 250ml', preco: 69.9,
    tipo: 'COSMETICO', linha: 'Cabelo', finalidade: 'Antiqueda', marca: 'Breck', cor: '0d0d0d',
    descricao: 'Shampoo com cafeina e niacinamida que estimula o couro cabeludo e reduz a queda por quebra.',
    especificacoes: { volume_ml: 250, tipo_cabelo: 'Todos', ingredientes_chave: 'Cafeina, niacinamida, biotina', aroma: 'Herbal fresco', livre_de: 'Sulfatos agressivos', modo_uso: 'Massagear e deixar agir 2 minutos' },
    quantidade: 38,
  },
  {
    codigo: 'SHP-002', categoria: 'Cabelo e Couro Cabeludo', nome: 'Shampoo Anticaspa Carvao Ativado 250ml', preco: 59.9,
    tipo: 'COSMETICO', linha: 'Cabelo', finalidade: 'Anticaspa', marca: 'Breck', cor: '0d0d0d',
    descricao: 'Detox semanal com carvao ativado que controla oleosidade e descamacao do couro cabeludo.',
    especificacoes: { volume_ml: 250, tipo_cabelo: 'Oleosos e mistos', ingredientes_chave: 'Carvao ativado, piroctona olamina, mentol', aroma: 'Mentolado', modo_uso: '2 a 3 vezes por semana' },
    quantidade: 29,
  },
  {
    codigo: 'SHP-003', categoria: 'Cabelo e Couro Cabeludo', nome: 'Tonico Capilar Fortalecedor 120ml', preco: 79.9,
    tipo: 'COSMETICO', linha: 'Cabelo', finalidade: 'Fortalecimento', marca: 'Breck', cor: '0d0d0d',
    descricao: 'Tonico leave-in de secagem rapida que fortalece o fio desde a raiz, sem deixar o cabelo oleoso.',
    especificacoes: { volume_ml: 120, tipo_cabelo: 'Todos', ingredientes_chave: 'Peptideos de cobre, arginina, pantenol', aroma: 'Neutro', modo_uso: 'Aplicar no couro seco todos os dias' },
    quantidade: 22,
  },
  {
    codigo: 'SHP-004', categoria: 'Cabelo e Couro Cabeludo', nome: 'Locao Pos-Barba Refrescante 120ml', preco: 49.9,
    tipo: 'COSMETICO', linha: 'Barba', finalidade: 'Calmante pos-barba', marca: 'Breck', cor: '0d0d0d',
    descricao: 'Locao sem alcool que acalma a pele depois da navalha, fecha os poros e evita a irritacao.',
    especificacoes: { volume_ml: 120, tipo_pele: 'Todas, inclusive sensivel', ingredientes_chave: 'Hamamelis, alantoina, aloe vera', aroma: 'Fresco citrico', livre_de: 'Alcool etilico', teste_dermatologico: 'Aprovado' },
    quantidade: 41,
  },

  // ---------- Maquinas e Aparadores ----------
  {
    codigo: 'MAQ-001', categoria: 'Maquinas e Aparadores', nome: 'Maquina de Corte Profissional Sem Fio', preco: 899.9,
    tipo: 'FERRAMENTA', linha: 'Maquinas', finalidade: 'Corte geral', marca: 'Breck Pro', cor: '1e1e1e',
    descricao: 'Motor sem escovas de alto torque, bateria de litio para 4 horas de uso e lamina destacavel de aco inox.',
    especificacoes: { motor: 'Brushless 7200 rpm', autonomia_min: 240, alimentacao: 'Bateria de litio recarregavel', material_lamina: 'Aco inoxidavel destacavel', itens_inclusos: 'Maquina + 8 pentes + oleo + base de carga', peso_g: 320, garantia: '24 meses' },
    quantidade: 9,
  },
  {
    codigo: 'MAQ-002', categoria: 'Maquinas e Aparadores', nome: 'Trimmer de Acabamento Lamina Zero', preco: 549.9,
    tipo: 'FERRAMENTA', linha: 'Maquinas', finalidade: 'Acabamento e pezinho', marca: 'Breck Pro', cor: '1e1e1e',
    descricao: 'Aparador com lamina T zerada para contornos, pezinho e desenho de barba com precisao cirurgica.',
    especificacoes: { motor: 'Rotativo 6500 rpm', autonomia_min: 180, alimentacao: 'Bivolt com bateria', material_lamina: 'Lamina T de aco carbono', itens_inclusos: 'Trimmer + 3 pentes + escova + oleo', peso_g: 180, garantia: '24 meses' },
    quantidade: 14,
  },
  {
    codigo: 'MAQ-003', categoria: 'Maquinas e Aparadores', nome: 'Kit 8 Pentes Guia Universais', preco: 89.9,
    tipo: 'FERRAMENTA', linha: 'Maquinas', finalidade: 'Graduacao do corte', marca: 'Breck Pro', cor: '1e1e1e',
    descricao: 'Jogo de pentes numerados de 1,5 mm a 25 mm com encaixe universal e marcacao em relevo.',
    especificacoes: { material: 'Polipropileno de alta resistencia', itens_inclusos: '8 pentes numerados + estojo', compatibilidade: 'Maquinas com encaixe universal', peso_g: 140, garantia: '6 meses' },
    quantidade: 60,
  },
  {
    codigo: 'MAQ-004', categoria: 'Maquinas e Aparadores', nome: 'Maquina com Fio Torque 8000 rpm', preco: 649.9,
    tipo: 'FERRAMENTA', linha: 'Maquinas', finalidade: 'Corte pesado', marca: 'Breck Pro', cor: '1e1e1e',
    descricao: 'Maquina com fio para uso continuo em barbearia de alto fluxo, com cabo profissional de 3 metros.',
    especificacoes: { motor: 'Magnetico 8000 rpm', alimentacao: 'Bivolt automatico', material_lamina: 'Aco japones ajustavel', itens_inclusos: 'Maquina + 4 pentes + chave + oleo', comprimento_cabo_m: 3, garantia: '24 meses' },
    quantidade: 0,
  },

  // ---------- Navalhas e Tesouras ----------
  {
    codigo: 'NAV-001', categoria: 'Navalhas e Tesouras', nome: 'Navalha de Barbeiro Cabo Madeira', preco: 149.9,
    tipo: 'FERRAMENTA', linha: 'Navalhas', finalidade: 'Barba e contorno', marca: 'Breck Steel', cor: '161616',
    descricao: 'Navalha de troca rapida com cabo em madeira nobre, trava de seguranca e 10 laminas inclusas.',
    especificacoes: { material_cabo: 'Madeira de nogueira', material_lamina: 'Aco inox descartavel', itens_inclusos: 'Navalha + 10 laminas + estojo', comprimento_cm: 16, peso_g: 95, garantia: '12 meses' },
    quantidade: 27,
  },
  {
    codigo: 'NAV-002', categoria: 'Navalhas e Tesouras', nome: 'Caixa 100 Laminas de Barbear Inox', preco: 59.9,
    tipo: 'FERRAMENTA', linha: 'Navalhas', finalidade: 'Reposicao', marca: 'Breck Steel', cor: '161616',
    descricao: 'Laminas de fio duplo com afiacao de precisao, embaladas individualmente para uso unico por cliente.',
    especificacoes: { material_lamina: 'Aco inoxidavel com revestimento de platina', itens_inclusos: '100 laminas em 20 cartelas', compatibilidade: 'Navalhas de encaixe padrao', uso: 'Descartavel por atendimento' },
    quantidade: 85,
  },
  {
    codigo: 'NAV-003', categoria: 'Navalhas e Tesouras', nome: 'Tesoura de Corte 6 Pol. Aco Japones', preco: 389.9,
    tipo: 'FERRAMENTA', linha: 'Tesouras', finalidade: 'Corte reto', marca: 'Breck Steel', cor: '161616',
    descricao: 'Tesoura profissional forjada em aco japones com fio navalha, parafuso ajustavel e apoio de dedo removivel.',
    especificacoes: { material_lamina: 'Aco japones 440C', tamanho: '6 polegadas', tipo_fio: 'Fio navalha', itens_inclusos: 'Tesoura + estojo + pano + oleo', peso_g: 62, garantia: '36 meses' },
    quantidade: 11,
  },
  {
    codigo: 'NAV-004', categoria: 'Navalhas e Tesouras', nome: 'Tesoura de Desbaste 30 Dentes', preco: 349.9,
    tipo: 'FERRAMENTA', linha: 'Tesouras', finalidade: 'Reducao de volume', marca: 'Breck Steel', cor: '161616',
    descricao: 'Desbaste equilibrado com 30 dentes, retira cerca de 30% do volume sem marcar degrau no cabelo.',
    especificacoes: { material_lamina: 'Aco japones 440C', tamanho: '6 polegadas', dentes: 30, remocao_media: '30% do volume', itens_inclusos: 'Tesoura + estojo', garantia: '36 meses' },
    quantidade: 3,
  },

  // ---------- Acessorios da Cadeira ----------
  {
    codigo: 'ACE-001', categoria: 'Acessorios da Cadeira', nome: 'Capa de Corte Impermeavel Antiestatica', preco: 99.9,
    tipo: 'FERRAMENTA', linha: 'Acessorios', finalidade: 'Atendimento', marca: 'Breck', cor: '242424',
    descricao: 'Capa leve com tratamento antiestatico que impede o cabelo de grudar e fecho de pressao regulavel.',
    especificacoes: { material: 'Poliester impermeavel', dimensoes_cm: '150 x 130', fecho: 'Pressao com 3 regulagens', lavavel: 'Sim, em maquina', peso_g: 240 },
    quantidade: 34,
  },
  {
    codigo: 'ACE-002', categoria: 'Acessorios da Cadeira', nome: 'Borrifador Profissional Nevoa 300ml', preco: 39.9,
    tipo: 'FERRAMENTA', linha: 'Acessorios', finalidade: 'Atendimento', marca: 'Breck', cor: '242424',
    descricao: 'Borrifador de nevoa continua e uniforme, com gatilho leve para uso repetido sem cansar a mao.',
    especificacoes: { capacidade_ml: 300, material: 'PET resistente com gatilho de aluminio', tipo_jato: 'Nevoa fina continua', peso_g: 120 },
    quantidade: 70,
  },
  {
    codigo: 'ACE-003', categoria: 'Acessorios da Cadeira', nome: 'Pincel de Barbear Cerdas Sinteticas', preco: 79.9,
    tipo: 'FERRAMENTA', linha: 'Acessorios', finalidade: 'Preparo da barba', marca: 'Breck', cor: '242424',
    descricao: 'Pincel de cerdas sinteticas macias que produz espuma densa e levanta os fios antes da navalha.',
    especificacoes: { material_cerdas: 'Fibra sintetica tipo texugo', material_cabo: 'Resina polida', altura_cm: 11, itens_inclusos: 'Pincel + suporte de secagem', peso_g: 85 },
    quantidade: 26,
  },
  {
    codigo: 'ACE-004', categoria: 'Acessorios da Cadeira', nome: 'Par de Toalhas Termicas de Barbearia', preco: 69.9,
    tipo: 'FERRAMENTA', linha: 'Acessorios', finalidade: 'Toalha quente', marca: 'Breck', cor: '242424',
    descricao: 'Toalhas de algodao penteado que seguram o calor por mais tempo no ritual da toalha quente.',
    especificacoes: { material: 'Algodao penteado 500 g/m2', dimensoes_cm: '80 x 40', itens_inclusos: '2 toalhas', lavavel: 'Sim, ate 90 graus' },
    quantidade: 48,
  },

  // ---------- Cursos e Vale-Presente (entrega digital) ----------
  {
    codigo: 'DIG-001', categoria: 'Cursos e Vale-Presente', nome: 'Curso Online: Degrade Perfeito do Zero', preco: 297,
    tipo: 'DIGITAL', linha: 'Cursos', finalidade: 'Formacao tecnica', marca: 'Breck Academy', cor: '1a1a1a',
    descricao: 'Do pezinho ao topo: 6 modulos gravados em estudio mostrando o degrade em diferentes tipos de cabelo.',
    especificacoes: { carga_horaria: '12 horas', modulos: 6, formato: 'Videoaulas em alta definicao', acesso: 'Vitalicio', certificado: 'Sim, com registro digital', nivel: 'Iniciante e intermediario' },
    quantidade: 0, ilimitado: true,
  },
  {
    codigo: 'DIG-002', categoria: 'Cursos e Vale-Presente', nome: 'Vale-Presente Digital R$ 100', preco: 100,
    tipo: 'DIGITAL', linha: 'Vale-presente', finalidade: 'Presente', marca: 'Breck', cor: '1a1a1a',
    descricao: 'Codigo enviado por e-mail na hora, valido para qualquer produto da loja ou servico na cadeira.',
    especificacoes: { valor: 'R$ 100,00', formato: 'Codigo alfanumerico por e-mail', validade: '12 meses a partir da compra', acesso: 'Uso unico', entregaveis: 'Cartao digital personalizavel' },
    quantidade: 0, ilimitado: true,
  },
  {
    codigo: 'DIG-003', categoria: 'Cursos e Vale-Presente', nome: 'E-book: Barbas e Formatos de Rosto', preco: 49.9,
    tipo: 'DIGITAL', linha: 'Cursos', finalidade: 'Consultoria de imagem', marca: 'Breck Academy', cor: '1a1a1a',
    descricao: 'Guia visual com 40 combinacoes de barba e corte indicadas para cada formato de rosto.',
    especificacoes: { formato: 'PDF ilustrado', paginas: 86, acesso: 'Download imediato e vitalicio', nivel: 'Todos os niveis', entregaveis: 'E-book + tabela de consulta rapida' },
    quantidade: 0, ilimitado: true,
  },
  {
    codigo: 'DIG-004', categoria: 'Cursos e Vale-Presente', nome: 'Curso Online: Gestao de Barbearia', preco: 397,
    tipo: 'DIGITAL', linha: 'Cursos', finalidade: 'Gestao do negocio', marca: 'Breck Academy', cor: '1a1a1a',
    descricao: 'Precificacao de servicos, controle de estoque, agenda e marketing local para lotar a cadeira.',
    especificacoes: { carga_horaria: '9 horas', modulos: 5, formato: 'Videoaulas + planilhas editaveis', acesso: 'Vitalicio', certificado: 'Sim, com registro digital', nivel: 'Dono de barbearia' },
    quantidade: 0, ilimitado: true,
  },
];

const USUARIOS = [
  {
    nome: 'Guilherme Bello', email: 'admin@breckbarber.com', senha: 'admin123',
    cpf: '52998224725', telefone: '(11) 98888-1010', perfil: 'ADMIN',
    cep: '01310100', logradouro: 'Avenida Paulista', numero: '1578', complemento: 'Loja 3',
    bairro: 'Bela Vista', cidade: 'Sao Paulo', uf: 'SP',
  },
  {
    nome: 'Joao Ricardo Alves', email: 'joao.cliente@email.com', senha: 'cliente123',
    cpf: '11144477735', telefone: '(11) 97777-2020', perfil: 'CLIENTE',
    cep: '04538133', logradouro: 'Avenida Brigadeiro Faria Lima', numero: '3477',
    bairro: 'Itaim Bibi', cidade: 'Sao Paulo', uf: 'SP',
  },
];

/** Cria um pedido historico ja com itens, deducao de estoque e entrega. */
async function criarPedidoHistorico(usuario, linhasDesejadas, mesesAtras, status) {
  const produtos = await Produto.findAll({
    where: { codigo: linhasDesejadas.map((l) => l.codigo) },
    include: [{ model: Estoque, as: 'estoque' }],
  });

  let subtotal = 0;
  let unidades = 0;
  const itens = produtos.map((produto) => {
    const linha = linhasDesejadas.find((l) => l.codigo === produto.codigo);
    const preco = Number(produto.preco);
    const totalLinha = Math.round((preco * linha.quantidade + Number.EPSILON) * 100) / 100;
    subtotal += totalLinha;
    unidades += linha.quantidade;
    return {
      produto_id: produto.id,
      nome_produto: produto.nome,
      quantidade: linha.quantidade,
      preco_unitario: preco,
      subtotal: totalLinha,
    };
  });

  const apenasDigital = produtos.every((p) => p.tipo === 'DIGITAL');
  const totais = calcularTotais(subtotal, unidades, apenasDigital);

  const data = new Date();
  data.setMonth(data.getMonth() - mesesAtras);

  const pedido = await Pedido.create({
    codigo: gerarCodigoPedido(),
    usuario_id: usuario.id,
    subtotal: totais.subtotal,
    percentual_desconto: totais.percentual_desconto,
    desconto: totais.desconto,
    frete: totais.frete,
    total: totais.total,
    regra_desconto: totais.regra_desconto,
    forma_pagamento: 'PIX',
    status,
  });

  // O Sequelize carimba created_at com "agora": reescrevemos a data historica
  // por SQL direto para os graficos nascerem com meses diferentes.
  await sequelize.query('UPDATE pedidos SET created_at = ?, updated_at = ? WHERE id = ?', {
    replacements: [data, data, pedido.id],
  });

  await ItemPedido.bulkCreate(itens.map((i) => ({ ...i, pedido_id: pedido.id })));

  for (const produto of produtos) {
    const linha = linhasDesejadas.find((l) => l.codigo === produto.codigo);
    if (produto.estoque && !produto.estoque.ilimitado) {
      await produto.estoque.update({
        quantidade: Math.max(0, produto.estoque.quantidade - linha.quantidade),
        ultima_movimentacao: data,
      });
    }
  }

  const previsao = new Date(data);
  previsao.setDate(previsao.getDate() + 7);

  await Entrega.create({
    pedido_id: pedido.id,
    tipo: apenasDigital ? 'DIGITAL' : 'FISICA',
    status: status === 'CONCLUIDO' ? 'ENTREGUE' : status === 'ENVIADO' ? 'EM_TRANSITO' : 'AGUARDANDO',
    codigo_rastreio: apenasDigital ? null : `BRK${String(pedido.id).padStart(8, '0')}BR`,
    transportadora: apenasDigital ? 'Entrega imediata por e-mail' : 'Breck Log',
    cep: usuario.cep, logradouro: usuario.logradouro, numero: usuario.numero,
    bairro: usuario.bairro, cidade: usuario.cidade, uf: usuario.uf,
    previsao_entrega: previsao.toISOString().slice(0, 10),
    data_entrega: status === 'CONCLUIDO' ? previsao : null,
  });

  return pedido;
}

async function executar() {
  try {
    await sequelize.authenticate();
    console.log('[seed] conectado ao banco.');

    // force: true recria o schema do zero a cada carga.
    await sequelize.sync({ force: true });
    console.log('[seed] tabelas recriadas.');

    const usuarios = [];
    for (const dados of USUARIOS) {
      usuarios.push(await Usuario.create(dados));
    }
    console.log(`[seed] ${usuarios.length} usuarios criados.`);

    const mapaCategorias = {};
    for (const dados of CATEGORIAS) {
      const categoria = await Categoria.create(dados);
      mapaCategorias[categoria.nome] = categoria.id;
    }
    console.log(`[seed] ${CATEGORIAS.length} categorias criadas.`);

    for (const item of PRODUTOS) {
      const produto = await Produto.create({
        codigo: item.codigo,
        nome: item.nome,
        descricao: item.descricao,
        preco: item.preco,
        imagem: img(item.codigo, item.cor),
        tipo: item.tipo,
        linha: item.linha,
        finalidade: item.finalidade,
        marca: item.marca,
        especificacoes: item.especificacoes,
        categoria_id: mapaCategorias[item.categoria],
      });

      await Estoque.create({
        produto_id: produto.id,
        quantidade: item.quantidade,
        quantidade_minima: item.tipo === 'DIGITAL' ? 0 : 5,
        ilimitado: Boolean(item.ilimitado),
        ultima_movimentacao: new Date(),
      });
    }
    console.log(`[seed] ${PRODUTOS.length} produtos criados com estoque.`);

    const cliente = usuarios[1];
    await criarPedidoHistorico(cliente, [{ codigo: 'POM-001', quantidade: 2 }, { codigo: 'BRB-001', quantidade: 1 }], 3, 'CONCLUIDO');
    await criarPedidoHistorico(cliente, [{ codigo: 'NAV-001', quantidade: 1 }, { codigo: 'ACE-002', quantidade: 2 }], 1, 'ENVIADO');
    await criarPedidoHistorico(cliente, [{ codigo: 'DIG-001', quantidade: 1 }], 0, 'PAGO');
    console.log('[seed] 3 pedidos historicos criados.');

    console.log('\n===============================================');
    console.log(' Carga inicial concluida com sucesso!');
    console.log(' Admin ..: admin@breckbarber.com / admin123');
    console.log(' Cliente : joao.cliente@email.com / cliente123');
    console.log('===============================================\n');

    await sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error('[seed] falhou:', e);
    process.exit(1);
  }
}

executar();
