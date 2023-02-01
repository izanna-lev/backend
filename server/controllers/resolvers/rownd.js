/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/**
 * This will handle the data coming from the decoded rownd token which is there in
 * tokenInfo object and pass in modelPromise function. Majorly user_id which is
 * rowndId of that user.
 * @author Pavleen Kaur
 * @since 21 Sept, 2022
 * @param {*} req
 * @param {*} res
 * @param {Promise} modelPromise the promise object that will handle the incoming route data
*/
export default (req, res, modelPromise) => {
	const { body } = req;
	const { user_id } = res.req.tokenInfo;
	const modelParams = { ...body, user_id };
	modelPromise(modelParams).then((success) => {
		const { code, data } = success;
		if (code === 401) {
			return res.status(401).send(success);
		}
		return res.status(200).send(success);
	}).catch((err) => {
		const { error } = err;
		return res.status(200).send(error || err);
	});
	// modelPromise(modelParams).then(

	// 	// success => res.status(200).send(success),
	// 	// error => res.status(200).send(error),
	// );
};
