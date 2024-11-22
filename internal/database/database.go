package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mahendhar9/chime/internal/config"
)

type Database struct {
	Pool *pgxpool.Pool
}

func New(cfg config.DatabaseConfig) (*Database, error) {
	config, err := pgxpool.ParseConfig(cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("error parsing database config: %w", err)
	}

	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("error creating connection pool: %w", err)
	}

	//Verify connection
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("error connecting to the database: %w", err)
	}

	return &Database{Pool: pool}, nil
}

func (db *Database) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}
