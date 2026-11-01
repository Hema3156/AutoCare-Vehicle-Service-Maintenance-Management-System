import { query } from '@/lib/db';
import { route, ok } from '@/lib/api';
import { sqlReports, mongoReports } from '@/lib/queries';

export const GET = route(['Admin'], async () => ok({ sql: await sqlReports(), mongo: await mongoReports() }));
