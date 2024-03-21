"use strict";

const express = require("express");

const db = require("../db");
const router = new express.Router();

const { BadRequestError, NotFoundError } = require('../expressError');

/** return JSON of info on invoices like  {invoices: [{id, comp_code}, ...]} */
router.get('/', async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
    FROM invoices
    ORDER BY id`
  );

  const invoices = results.rows;

  return res.json({ invoices });
});

module.exports = router;

/** return JSON of info on one invoice like
 * {invoice:
 * {id, amt, paid, add_date, paid_date, company: {code, name, description}} */

router.get('/:id', async function (req, res) {

  const id = Number(req.params.id);

  const results = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
    FROM invoices
    WHERE id = $1`,
    [id]
  );

  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`Can't find invoice, ${id}`)


  const company = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`,
    [invoice.comp_code]
  );

  invoice.company = company.rows[0];

  return res.json({ invoice });
});

module.exports = router;