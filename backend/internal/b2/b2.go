package b2

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Client struct {
	bucket        string
	keyPrefix     string
	client        *s3.Client
	presignClient *s3.PresignClient
}

func New(endpoint, region, accessKeyID, secretAccessKey, bucket, keyPrefix string) *Client {
	cfg := aws.Config{
		Region:       region,
		Credentials:  credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, ""),
		BaseEndpoint: aws.String(endpoint),
	}
	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.UsePathStyle = true
	})
	return &Client{
		bucket:        bucket,
		keyPrefix:     strings.Trim(keyPrefix, "/"),
		client:        client,
		presignClient: s3.NewPresignClient(client),
	}
}

func (c *Client) objectKey(key string) string {
	key = strings.TrimLeft(key, "/")
	if c.keyPrefix == "" {
		return key
	}
	return c.keyPrefix + "/" + key
}

func (c *Client) GenerateUploadURL(ctx context.Context, key, contentType string) (string, error) {
	req, err := c.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(c.objectKey(key)),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(15*time.Minute))
	if err != nil {
		return "", fmt.Errorf("presign upload: %w", err)
	}
	return req.URL, nil
}

func (c *Client) GenerateDownloadURL(ctx context.Context, key string) (string, error) {
	req, err := c.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(c.objectKey(key)),
	}, s3.WithPresignExpires(15*time.Minute))
	if err != nil {
		return "", fmt.Errorf("presign download: %w", err)
	}
	return req.URL, nil
}
