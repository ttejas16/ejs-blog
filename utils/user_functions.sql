CREATE OR REPLACE FUNCTION user_lookup(_email VARCHAR(500))
RETURNS TABLE(email VARCHAR(500),hash VARCHAR(500),user_id INT) AS $$
BEGIN 
	RETURN QUERY SELECT * FROM users WHERE users.email = _email; 
END;
$$ LANGUAGE plpgsql;




CREATE OR REPLACE FUNCTION insert_user(_email VARCHAR(500),_hash VARCHAR(500))
RETURNS TABLE(user_id INT) AS $$
BEGIN 
	RETURN QUERY INSERT INTO users(email, hash)
	VALUES(_email, _hash) RETURNING users.user_id; 
END;
$$ LANGUAGE plpgsql;