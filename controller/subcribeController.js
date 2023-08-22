const User = require('../model/user');
const jwt = require('jsonwebtoken');
const request = require('request');
require('dotenv').config();

// Subscribe handler
const subscribe = async (req, res) => {
    const { email, address } = req.body;

    // Generate access and refresh tokens
    const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });

    // Check if email and address are provided
    if (!email || !address) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const users = await User.find().exec();
        const user = await User.findOne({ email }).exec();

        // Check if user is already on the waitlist
        if (user) {
            return res.status(409).json({ error: 'Already on the waitlist' });
        }

        // Generate a random position
        // const position = Math.floor(Math.random() * 20001);
        const position = users.length + 15122;

        // Prepare data for Mailchimp API request
        const fetchData = {
            members: [{
                email_address: email,
                status: "subscribed",
            }]
        };

        const options = {
            url: "https://us13.api.mailchimp.com/3.0/lists/03b8510f8f",
            method: "POST",
            headers: {
                Authorization: `auth ${process.env.API_KEY}`,
            },
            body: JSON.stringify(fetchData),
        };

        // Make a request to Mailchimp API to add the user to the waitlist
        request(options, async (error, response, body) => {
            // Check if request was successful
            if (!error && response.statusCode === 200) {
                // Create a new user in the database
                await User.create({
                    email,
                    wallet_address: address,
                    position,
                    refresh_token: refreshToken
                });

            } else {
                // Return error response
                return res.status(500).json({ error });
            }
        });

        // Set the refresh token in a cookie
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Return success response
        return res.status(201).json({ message: 'You are now on the waitlist', accessToken, position });
    } catch (error) {
        // Return error response
        return res.status(500).json({ error: error.message });
    }
};

// Check position handler
const checkPosition = async (req, res) => {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }

    // Check if user is already on the waitlist
    const user = await User.findOne({ email }).exec();

    if (!user) {
        return res.status(401).json({ error: 'You are not on the waitlist' });
    }

    // Generate access and refresh tokens
    const accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

    const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });

    // Update the user's refresh token
    user.refresh_token = refreshToken;
    await user.save()

    // Set the refresh token in a cookie
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Return success response
    res.status(200).json({ accessToken, position: user.position });
}

// Logout handler
const logout = async (req, res) => {
    // Get the refresh token
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    // Delete the refresh token
    const user = await User.findOneAndUpdate(
        { refresh_token: refreshToken },
        { refresh_token: "" }
    ).exec();

    // Clear the cookie
    if (!user) {
        res.clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
        });
        return res.sendStatus(204);
    }

    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'none',
        secure: true
    });
    res.sendStatus(204);
}
module.exports = {
    subscribe,
    checkPosition,
    logout
}