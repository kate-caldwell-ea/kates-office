/**
 * Database wrapper for sql.js that provides a better-sqlite3-like API
 */

class DatabaseWrapper {
  constructor(sqliteDb) {
    this.db = sqliteDb;
  }

  // Execute a statement that doesn't return rows
  run(sql, ...params) {
    try {
      this.db.run(sql, params);
      return { changes: this.db.getRowsModified() };
    } catch (error) {
      console.error('DB run error:', sql, params, error.message);
      throw error;
    }
  }

  // Execute and return all rows
  all(sql, ...params) {
    try {
      const stmt = this.db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } catch (error) {
      console.error('DB all error:', sql, params, error.message);
      throw error;
    }
  }

  // Execute and return first row
  get(sql, ...params) {
    try {
      const stmt = this.db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      let row = null;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      return row;
    } catch (error) {
      console.error('DB get error:', sql, params, error.message);
      throw error;
    }
  }

  // Execute raw SQL (for schema, etc.)
  exec(sql) {
    try {
      this.db.run(sql);
    } catch (error) {
      console.error('DB exec error:', error.message);
      throw error;
    }
  }

  // Create a prepared statement proxy
  prepare(sql) {
    const self = this;
    return {
      run: (...params) => self.run(sql, ...params),
      all: (...params) => self.all(sql, ...params),
      get: (...params) => self.get(sql, ...params),
    };
  }
}

module.exports = DatabaseWrapper;
