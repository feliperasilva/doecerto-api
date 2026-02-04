// prisma/seed.ts
import { PrismaClient, VerificationStatus, Role } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORDS = {
  admin: 'Admin@123456',
  donor: 'Donor@123456',
  ong: 'Ong@123456',
};

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Limpar dados existentes (ordem para respeitar FKs)
  console.log('🗑️  Cleaning existing data...');
  await prisma.rating.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.address.deleteMany();
  await prisma.ongProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.donorProfile.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.ong.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Data cleaned\n');

  const [adminPassword, donorPassword, ongPassword] = await Promise.all([
    bcrypt.hash(PASSWORDS.admin, 10),
    bcrypt.hash(PASSWORDS.donor, 10),
    bcrypt.hash(PASSWORDS.ong, 10),
  ]);

  // ==================== ADMINS ====================
  console.log('👑 Creating admins...');
  const adminSeeds = [
    { name: 'Ana Reviewer', email: 'ana.reviewer@sistema.com' },
    { name: 'Bruno Auditor', email: 'bruno.auditor@sistema.com' },
    { name: 'Clara Supervisor', email: 'clara.supervisor@sistema.com' },
    { name: 'Diego Verifier', email: 'diego.verifier@sistema.com' },
  ];

  const admins = [] as { userId: number; email: string }[];
  for (const admin of adminSeeds) {
    const user = await prisma.user.create({
      data: {
        name: admin.name,
        email: admin.email,
        password: adminPassword,
        role: Role.admin,
      },
    });
    await prisma.admin.create({ data: { userId: user.id } });
    admins.push({ userId: user.id, email: admin.email });
    console.log(`✅ Admin created: ${admin.email}`);
  }

  // ==================== DOADORES ====================
  console.log('👤 Creating donors...');
  const donorSeeds = [
    { name: 'Carlos Oliveira', email: 'carlos.oliveira@email.com', cpf: '123.456.789-00' },
    { name: 'Fernanda Lima', email: 'fernanda.lima@email.com', cpf: '987.654.321-00' },
    { name: 'Gabriel Souza', email: 'gabriel.souza@email.com', cpf: '321.654.987-00' },
    { name: 'Helena Martins', email: 'helena.martins@email.com', cpf: '159.753.486-20' },
    { name: 'Igor Ribeiro', email: 'igor.ribeiro@email.com', cpf: '852.456.951-30' },
    { name: 'Julia Fernandes', email: 'julia.fernandes@email.com', cpf: '741.258.963-40' },
    { name: 'Lucas Pereira', email: 'lucas.pereira@email.com', cpf: '258.369.147-50' },
    { name: 'Mariana Costa', email: 'mariana.costa@email.com', cpf: '369.258.147-60' },
    { name: 'Nicolas Rocha', email: 'nicolas.rocha@email.com', cpf: '147.258.369-70' },
    { name: 'Olivia Nunes', email: 'olivia.nunes@email.com', cpf: '456.789.123-80' },
  ];

  const donors = [] as { userId: number; email: string }[];
  for (const donor of donorSeeds) {
    const user = await prisma.user.create({
      data: {
        name: donor.name,
        email: donor.email,
        password: donorPassword,
        role: Role.donor,
      },
    });
    await prisma.donor.create({ data: { userId: user.id, cpf: donor.cpf } });
    donors.push({ userId: user.id, email: donor.email });
    console.log(`✅ Donor created: ${donor.email}`);
  }

  // ==================== ONGs ====================
  console.log('🏢 Creating ONGs...');
  const ongSeeds = [
    { name: 'ONG Esperança', email: 'contato@ongesperanca.org', cnpj: '12.345.678/0001-90', status: VerificationStatus.pending },
    { name: 'Instituto Viver Bem', email: 'contato@viverbem.org.br', cnpj: '98.765.432/0001-10', status: VerificationStatus.verified },
    { name: 'Fundação Amigos do Futuro', email: 'admin@amigosdofuturo.org', cnpj: '11.222.333/0001-44', status: VerificationStatus.verified },
    { name: 'Associação Mãos Solidárias', email: 'contato@maossolidarias.org', cnpj: '22.333.444/0001-55', status: VerificationStatus.pending },
    { name: 'ONG Luz da Vida', email: 'contato@luzdavida.org.br', cnpj: '33.444.555/0001-66', status: VerificationStatus.rejected },
    { name: 'Instituto Crescer', email: 'admin@institutocrescer.org', cnpj: '44.555.666/0001-77', status: VerificationStatus.verified },
    { name: 'Casa da Esperança', email: 'contato@casaesperanca.org', cnpj: '55.666.777/0001-88', status: VerificationStatus.pending },
    { name: 'Fundação Semear', email: 'admin@fundacaosemear.org.br', cnpj: '66.777.888/0001-99', status: VerificationStatus.verified },
    { name: 'ONG Renascer', email: 'contato@ongrenascer.org', cnpj: '77.888.999/0001-11', status: VerificationStatus.rejected },
    { name: 'Instituto Amor e Paz', email: 'admin@amorepaz.org.br', cnpj: '88.999.000/0001-22', status: VerificationStatus.pending },
    { name: 'Rede Solidária', email: 'contato@redesolidaria.org', cnpj: '99.111.222/0001-33', status: VerificationStatus.verified },
    { name: 'Projeto Aurora', email: 'admin@projetoaurora.org', cnpj: '10.101.010/0001-44', status: VerificationStatus.pending },
    { name: 'Instituto Vida Plena', email: 'contato@vidaplena.org', cnpj: '12.101.202/0001-55', status: VerificationStatus.verified },
    { name: 'SOS Animais', email: 'contato@sosanimais.org', cnpj: '14.141.414/0001-66', status: VerificationStatus.pending },
    { name: 'Criança Feliz', email: 'contato@criancafeliz.org', cnpj: '16.161.616/0001-77', status: VerificationStatus.verified },
  ];

  const ongs = [] as {
    userId: number;
    name: string;
    status: VerificationStatus;
  }[];

  for (const ong of ongSeeds) {
    const user = await prisma.user.create({
      data: {
        name: ong.name,
        email: ong.email,
        password: ongPassword,
        role: Role.ong,
      },
    });

    const verifier = admins[Math.floor(Math.random() * admins.length)]?.userId;
    const nowMinusDays = new Date(
      Date.now() - Math.floor(Math.random() * 20 + 1) * 24 * 60 * 60 * 1000,
    );

    await prisma.ong.create({
      data: {
        userId: user.id,
        cnpj: ong.cnpj,
        verificationStatus: ong.status,
        verifiedAt: ong.status === VerificationStatus.verified ? nowMinusDays : null,
        verifiedById: ong.status === VerificationStatus.verified ? verifier : null,
        rejectionReason:
          ong.status === VerificationStatus.rejected
            ? 'Documentação incompleta ou divergente.'
            : null,
      },
    });

    ongs.push({ userId: user.id, name: ong.name, status: ong.status });
    const statusIcon =
      ong.status === VerificationStatus.verified ? '✅' :
      ong.status === VerificationStatus.rejected ? '❌' : '⏳';
    console.log(`${statusIcon} ONG: ${ong.name} (${ong.email})`);
  }
  console.log('');

  // ==================== CATEGORIAS ====================
  console.log('🏷️  Creating categories...');
  const categoryNames = [
    'Educação',
    'Saúde',
    'Meio Ambiente',
    'Assistência Social',
    'Cultura e Arte',
    'Direitos Humanos',
    'Proteção Animal',
    'Desenvolvimento Comunitário',
    'Alimentação',
    'Moradia',
    'Esporte e Lazer',
    'Tecnologia e Inovação',
  ];

  const categories: { id: number; name: string }[] = [];
  for (const name of categoryNames) {
    const category = await prisma.category.create({ data: { name } });
    categories.push(category);
    console.log(`✅ Category: ${name}`);
  }
  console.log('');

  // ==================== PERFIS DE ONG ====================
  console.log('📝 Creating ONG profiles...');
  const profileSeeds = [
    {
      ongId: ongs[1].userId,
      bio: 'Promovemos saúde e bem-estar para comunidades carentes através de atendimento médico gratuito e programas de prevenção.',
      contactNumber: '(11) 98001-2345',
      websiteUrl: 'https://viverbem.org.br',
      avatarUrl: '/uploads/profiles/instituto-viver-bem.jpg',
      categoryIds: [categories[1].id, categories[3].id],
    },
    {
      ongId: ongs[2].userId,
      bio: 'Dedicados à educação de qualidade para crianças e jovens em situação de vulnerabilidade social, construindo um futuro melhor.',
      contactNumber: '(11) 98002-3456',
      websiteUrl: 'https://amigosdofuturo.org',
      avatarUrl: '/uploads/profiles/amigos-do-futuro.jpg',
      categoryIds: [categories[0].id, categories[7].id],
    },
    {
      ongId: ongs[5].userId,
      bio: 'Oferecemos capacitação profissional e desenvolvimento pessoal para adolescentes e adultos em busca de oportunidades.',
      contactNumber: '(11) 98005-6789',
      websiteUrl: 'https://institutocrescer.org',
      avatarUrl: '/uploads/profiles/instituto-crescer.jpg',
      categoryIds: [categories[0].id, categories[11].id],
    },
    {
      ongId: ongs[7].userId,
      bio: 'Trabalhamos pela preservação ambiental e educação ecológica, semeando consciência para um planeta sustentável.',
      contactNumber: '(11) 98007-8901',
      websiteUrl: 'https://fundacaosemear.org.br',
      avatarUrl: '/uploads/profiles/fundacao-semear.jpg',
      categoryIds: [categories[2].id, categories[0].id],
    },
    {
      ongId: ongs[10].userId,
      bio: 'Conectamos doadores e voluntários a famílias necessitadas, promovendo solidariedade e transformação social.',
      contactNumber: '(11) 98010-1234',
      websiteUrl: 'https://redesolidaria.org',
      avatarUrl: '/uploads/profiles/rede-solidaria.jpg',
      categoryIds: [categories[3].id, categories[8].id],
    },
    {
      ongId: ongs[12].userId,
      bio: 'Cuidamos de idosos em situação de abandono, oferecendo acolhimento, saúde e dignidade na terceira idade.',
      contactNumber: '(11) 98012-3456',
      websiteUrl: 'https://vidaplena.org',
      avatarUrl: '/uploads/profiles/vida-plena.jpg',
      categoryIds: [categories[1].id, categories[3].id],
    },
    {
      ongId: ongs[14].userId,
      bio: 'Proporcionamos alegria, educação e apoio emocional para crianças hospitalizadas e em tratamento de saúde.',
      contactNumber: '(11) 98014-5678',
      websiteUrl: 'https://criancafeliz.org',
      avatarUrl: '/uploads/profiles/crianca-feliz.jpg',
      categoryIds: [categories[1].id, categories[0].id, categories[4].id],
    },
  ];

  for (const profile of profileSeeds) {
    const { categoryIds, ...profileData } = profile;
    await prisma.ongProfile.create({
      data: {
        ...profileData,
        categories: {
          connect: categoryIds.map(id => ({ id })),
        },
      },
    });
    console.log(`✅ Profile created: ${ongs.find(o => o.userId === profile.ongId)?.name}`);
  }
  console.log('');

  console.log('🧾 Creating wishlist items...');
  const wishlistSeeds = [
    { ong: ongs[1], description: 'Cestas básicas', quantity: 50 },
    { ong: ongs[1], description: 'Kits de higiene', quantity: 80 },
    { ong: ongs[2], description: 'Materiais escolares', quantity: 120 },
    { ong: ongs[4], description: 'Ração para animais', quantity: 200 },
    { ong: ongs[5], description: 'Cobertores', quantity: 60 },
    { ong: ongs[6], description: 'Brinquedos educativos', quantity: 90 },
    { ong: ongs[10], description: 'Computadores usados', quantity: 15 },
    { ong: ongs[14], description: 'Roupas infantis', quantity: 150 },
  ].filter((item) => item.ong); // Garante índices válidos

  for (const item of wishlistSeeds) {
    await prisma.wishlistItem.create({
      data: {
        description: item.description,
        quantity: item.quantity,
        ongId: item.ong.userId,
      },
    });
  }
  console.log(`✅ ${wishlistSeeds.length} wishlist items created`);
  console.log('');

  console.log('💝 Creating donations...');
  const verifiedOngs = ongs.filter((o) => o.status === VerificationStatus.verified);

  const donationSeeds = [
    { donor: donors[0], ong: verifiedOngs[0], type: 'monetary', status: 'completed', amount: 500.0, currency: 'BRL' },
    { donor: donors[1], ong: verifiedOngs[1], type: 'material', status: 'pending', materialDescription: 'Cestas básicas', materialQuantity: 30 },
    { donor: donors[2], ong: verifiedOngs[2], type: 'monetary', status: 'completed', amount: 250.0, currency: 'BRL' },
    { donor: donors[3], ong: verifiedOngs[0], type: 'material', status: 'completed', materialDescription: 'Kits de higiene', materialQuantity: 100 },
    { donor: donors[4], ong: verifiedOngs[3] ?? verifiedOngs[0], type: 'monetary', status: 'canceled', amount: 120.0, currency: 'BRL' },
    { donor: donors[5], ong: verifiedOngs[1], type: 'monetary', status: 'pending', amount: 75.0, currency: 'BRL' },
    { donor: donors[6], ong: verifiedOngs[4] ?? verifiedOngs[0], type: 'material', status: 'pending', materialDescription: 'Roupas', materialQuantity: 60 },
    { donor: donors[7], ong: verifiedOngs[2], type: 'monetary', status: 'completed', amount: 320.0, currency: 'BRL' },
  ].filter((d) => d.donor && d.ong);

  const donationRecords = [] as { id: number; donorId: number; ongId: number }[];

  for (const donation of donationSeeds) {
    const record = await prisma.donation.create({
      data: {
        donationType: donation.type as any,
        donationStatus: donation.status as any,
        monetaryAmount: donation.amount ?? null,
        monetaryCurrency: donation.currency ?? null,
        materialDescription: donation.materialDescription ?? null,
        materialQuantity: donation.materialQuantity ?? null,
        donorId: donation.donor.userId,
        ongId: donation.ong.userId,
      },
    });
    donationRecords.push({ id: record.id, donorId: record.donorId, ongId: record.ongId });
  }
  console.log(`✅ ${donationRecords.length} donations created`);
  console.log('');
  // ==================== AVALIAÇÕES ====================
  console.log('⭐ Creating ratings...');
  const ratingsSeeds = [
    { donor: donors[0], ong: verifiedOngs[0], score: 5, comment: 'Transparente e ágil.' },
    { donor: donors[2], ong: verifiedOngs[2], score: 4, comment: 'Boa comunicação.' },
    { donor: donors[3], ong: verifiedOngs[0], score: 5, comment: 'Impacto real na comunidade.' },
    { donor: donors[7], ong: verifiedOngs[2], score: 3, comment: 'Pode melhorar feedback pós-doação.' },
  ].filter((r) => r.donor && r.ong);

  for (const rating of ratingsSeeds) {
    await prisma.rating.upsert({
      where: {
        ongId_donorId: { ongId: rating.ong.userId, donorId: rating.donor.userId },
      },
      update: { score: rating.score, comment: rating.comment },
      create: {
        ongId: rating.ong.userId,
        donorId: rating.donor.userId,
        score: rating.score,
        comment: rating.comment,
      },
    });
  }
  console.log(`✅ ${ratingsSeeds.length} ratings created`);

  // Recalcular métricas de rating por ONG
  const ratedOngIds = Array.from(new Set(ratingsSeeds.map((r) => r.ong.userId)));
  for (const ongId of ratedOngIds) {
    const stats = await prisma.rating.aggregate({
      where: { ongId },
      _avg: { score: true },
      _count: { score: true },
    });
    await prisma.ong.update({
      where: { userId: ongId },
      data: {
        averageRating: stats._avg.score || 0,
        numberOfRatings: stats._count.score || 0,
      },
    });
  }
  console.log('✅ Rating stats updated\n');

  // ==================== RESUMO ====================
  console.log('\n' + '='.repeat(50));
  console.log('📊 SEED SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ ${admins.length} Admins created`);
  console.log(`✅ ${donors.length} Donors created`);
  console.log(`✅ ${ongs.length} ONGs created (Verified: ${ongs.filter(o => o.status === VerificationStatus.verified).length}, Pending: ${ongs.filter(o => o.status === VerificationStatus.pending).length}, Rejected: ${ongs.filter(o => o.status === VerificationStatus.rejected).length})`);
  console.log(`✅ ${categories.length} Categories created`);
  console.log(`✅ ${profileSeeds.length} ONG profiles created`);
  console.log(`✅ ${wishlistSeeds.length} Wishlist items created`);
  console.log(`✅ ${donationRecords.length} Donations created`);
  console.log(`✅ ${ratingsSeeds.length} Ratings created`);
  console.log('\n🔑 DEFAULT PASSWORDS (change in production!):');
  console.log(`  Admin: ${PASSWORDS.admin}`);
  console.log(`  Donor: ${PASSWORDS.donor}`);
  console.log(`  ONG:   ${PASSWORDS.ong}`);
  console.log('='.repeat(50) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });