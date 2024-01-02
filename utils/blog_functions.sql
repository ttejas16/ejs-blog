CREATE OR REPLACE FUNCTION insert_blog(
	_email VARCHAR(50),
	_body TEXT,
	_title TEXT,
	_subtitle TEXT,
	_category TEXT,
	_image_blob BYTEA,
	_date DATE
)
RETURNS TABLE(blog_id INT) AS $$
BEGIN
	RETURN QUERY INSERT INTO blogs(
	author_email,
	blog_body,
	blog_title,
	blog_subtitle,
	blog_category,
	blog_image_blob,
	published_date) VALUES
	(
		_email,
		_body,
		_title,
		_subtitle,
		_category,
		_image_blob,
		_date
	) RETURNING blogs.blog_id;
END;
$$ LANGUAGE PLPGSQL;



CREATE OR REPLACE FUNCTION blog_lookup(b_id INT)
RETURNS TABLE(
	blog_id INT,
	author_email VARCHAR(50),
	blog_body TEXT,
	blog_title TEXT,
	blog_subtitle TEXT,
	blog_category TEXT,
	blog_image_blob BYTEA,
	published_date TEXT,
	no_of_likes INT) AS $$
BEGIN
	RETURN QUERY SELECT 
	blogs.blog_id,
	blogs.author_email,
	blogs.blog_body,
	blogs.blog_title,
	blogs.blog_subtitle,
	blogs.blog_category,
	blogs.blog_image_blob,
	TO_CHAR(blogs.published_date,'Mon DD YYYY'),
	blogs.no_of_likes FROM blogs WHERE blogs.blog_id = b_id;
END;
$$ LANGUAGE PLPGSQL;




CREATE OR REPLACE FUNCTION bloglist_lookup(email VARCHAR(50))
RETURNS TABLE(
	blog_id INT,
	author_email VARCHAR(50),
	blog_body TEXT,
	blog_title TEXT,
	blog_subtitle TEXT,
	blog_category TEXT,
	blog_image_blob BYTEA,
	published_date TEXT,
	no_of_likes INT) AS $$
BEGIN
	RETURN QUERY SELECT
	blogs.blog_id,
	blogs.author_email,
	blogs.blog_body,
	blogs.blog_title,
	blogs.blog_subtitle,
	blogs.blog_category,
	blogs.blog_image_blob,
	TO_CHAR(blogs.published_date,'Mon DD YYYY') ,
	blogs.no_of_likes FROM blogs where blogs.author_email = email;
END;
$$ LANGUAGE PLPGSQL;



CREATE OR REPLACE FUNCTION random_lookup()
RETURNS TABLE(
	blog_id INT,
	author_email VARCHAR(50),
	blog_body TEXT,
	blog_title TEXT,
	blog_subtitle TEXT,
	blog_category TEXT,
	blog_image_blob BYTEA,
	published_date TEXT,
	no_of_likes INT) AS $$
BEGIN
	RETURN QUERY SELECT 
	blogs.blog_id,
	blogs.author_email,
	blogs.blog_body,
	blogs.blog_title,
	blogs.blog_subtitle,
	blogs.blog_category,
	blogs.blog_image_blob,
	TO_CHAR(blogs.published_date,'Mon DD YYYY'),
	blogs.no_of_likes FROM blogs ORDER BY random() limit 3;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION delete_blog(_id INT,_email VARCHAR(50))
RETURNS TABLE(blog_id INT) AS $$
BEGIN 
	RETURN QUERY DELETE FROM blogs WHERE blogs.blog_id = _id AND blogs.author_email = _email RETURNING blogs.blog_id;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION like_lookup(user_id INT,blog_id INT)
RETURNS TABLE(is_liked BOOLEAN) AS $$
BEGIN
	RETURN QUERY SELECT EXISTS (SELECT * FROM likes WHERE likes.like_blog_id = blog_id AND likes.like_user_id = user_id);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION toggle_like(user_id INT,blog_id INT) 
RETURNS BOOLEAN AS $$
DECLARE
	isLiked BOOLEAN;
BEGIN
	SELECT is_liked INTO isLiked FROM like_lookup(user_id,_blog_id);
	
	IF isLiked THEN
		DELETE FROM likes WHERE likes.like_user_id = user_id AND likes.like_blog_id = _blog_id;
		UPDATE blogs SET no_of_likes = no_of_likes - 1 WHERE blog_id = _blog_id;
	ELSE
		INSERT INTO likes values(user_id,_blog_id);
		UPDATE blogs SET no_of_likes = no_of_likes + 1 WHERE blog_id = _blog_id;
	END IF;
	
	RETURN isLiked;
END;
$$ LANGUAGE plpgsql;

