"use strict";

const express = require("express");

const db = require("../db");
const router = new express.Router();

const { BadRequestError, NotFoundError } = require('../expressError');

/** returns JSON list of companies like {companies: [{code, name}, ...]}*/

router.get('/', async function (req, res, next) {

  const results = await db.query(
    `SELECT code, name
    FROM companies
    ORDER BY code`
  );

  const companies = results.rows;

  return res.json({ companies });

});

/** Returns info on one company,
 * JSON  like {company: {code, name, description, invoices: [id, ...]}}*/

router.get('/:code', async function (req, res, next) {

  const code = req.params.code;

  // if(!code) throw new BadRequestError("Must include code")

  const cResults = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`, [code]
  );

  const company = cResults.rows[0];

  if (!company) throw new NotFoundError(`Company not found, ${code}`);

  const iResults = await db.query(
    `SELECT id
    FROM invoices
    WHERE comp_code = $1`,
    [code]
  );

  const invoiceIds = iResults.rows.map(invoice => invoice.id)
  company.invoices = invoiceIds

  return res.json({ company });

});


/**Recieves json.  Returns info on the new comopany, JSON  like
 * {company: {code, name, description}}*/

router.post('/', async function (req, res, next) {

  if (!req.body) throw new BadRequestError("Must include body"); // dont pass anything

  const { code, name, description } = req.body;

  const hasUndefined = [code, name, description].some(input => input === undefined);
  if (hasUndefined) throw new BadRequestError("Request must include all required fields");

  // if (!code) {
  //   throw new BadRequestError("Request must include a code");
  // } else if (!name) {
  //   throw new BadRequestError("Request must include a name");
  // } else if (!description) {
  //   throw new BadRequestError("Request must include a description");
  // }

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
    VALUES ($1, $2, $3)
    RETURNING code, name, description`,
    [code, name, description]
  );

  const company = results.rows[0];

  return res.status(201).json({ company });

});

/** Edits an existing company,
 * takes JSON like {name, description}
 * returns JSON like {company: {code, name, description}}
 */
router.put('/:code', async function (req, res, next) {

  if (!req.body) throw new BadRequestError("Must include body"); // dont pass anything
  const { name, description } = req.body;;
  const code = req.params.code;

  const hasUndefined = [name, description].some(input => input === undefined);
  if (hasUndefined) throw new BadRequestError("Request must include all required fields");

  const results = await db.query(
    `UPDATE companies
    SET name = $1,
    description = $2
    WHERE code = $3
    RETURNING code, name, description`,
    [name, description, code]
  );

  const company = results.rows[0];
  if (!company) throw new NotFoundError(`Company not found, id: ${code}`);

  return res.json({ company });

});


/** Deletes an existing company,
 * takes url param :code
 * returns JSON like {status: deleted}
 */
router.delete('/:code', async function (req, res, next) {
  const code = req.params.code;

  const company = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`, [code]
  );

  if (!company.rows[0]) throw new NotFoundError(`Company not found, ${code}`);
  // TODO: RETURING code
  await db.query(
    `DELETE
    FROM companies
    WHERE code = $1`, [code]
  );

  return res.json({ status: "deleted" });

});

module.exports = router;