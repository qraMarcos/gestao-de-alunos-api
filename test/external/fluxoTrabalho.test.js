import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import { api } from '../helpers/api.js';
import { loginAdmin, loginAluno } from '../helpers/auth.js';

const dadosTrabalhos = JSON.parse(
  readFileSync(new URL('../fixtures/trabalho.json', import.meta.url), 'utf8')
);

describe('Fluxo de cadastro e entrega de trabalho', () => {
  for (const dados of dadosTrabalhos) {
    it(`deve cadastrar ${dados.aluno.nome} e registrar um trabalho`, async () => {
      const timestamp = Date.now();
      const email = `${dados.aluno.emailPrefix}.${timestamp}@example.com`;
      const matricula = `${dados.aluno.matriculaPrefix}${timestamp}`;

      const tokenAdmin = await loginAdmin();

      const respostaAluno = await api()
        .post('/api/admin/alunos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nome: dados.aluno.nome,
          email,
          matricula,
          senha: dados.aluno.senha,
        });

      expect(respostaAluno.status).to.equal(201);
      const alunoId = respostaAluno.body.id;

      const respostaMatricula = await api()
        .post(`/api/admin/disciplinas/${dados.trabalho.disciplinaId}/matriculas`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ alunoId });

      expect(respostaMatricula.status).to.equal(201);

      const tokenAluno = await loginAluno(email, dados.aluno.senha);

      const respostaTrabalho = await api()
        .post(`/api/alunos/${alunoId}/trabalhos`)
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send({
          disciplinaId: dados.trabalho.disciplinaId,
          titulo: dados.trabalho.titulo,
          descricao: dados.trabalho.descricao,
        });

      expect(respostaTrabalho.status).to.equal(201);
      expect(respostaTrabalho.body).to.include({
        alunoId,
        disciplinaId: dados.trabalho.disciplinaId,
        titulo: dados.trabalho.titulo,
        status: 'entregue',
      });
    });
  }
});
